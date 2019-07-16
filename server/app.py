#!/usr/bin/env/python
# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, abort
from flask_redis import FlaskRedis
from push_notifications import push
from collections import OrderedDict
import json
import jwt
import os
import time
import math
import uuid

# ========================= SERVER SETUP JUNK =============================== #
REDIS_URL = 'redis://localhost:6379/2'
serve_extensions = [
    '.css', '.gif', '.htm', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json',
    '.png', '.svg', '.txt', '.webp', '.xml'
]

webapp_folder = os.path.join(os.path.dirname(os.getcwd()), 'webapp', 'build')

jwt_secret = 'I sure hope nobody can figure this out'

app = Flask(__name__, static_folder=webapp_folder)
app.config['REDIS_URL'] = REDIS_URL
app.config['SECRET_KEY'] = "co2 it's easy as 1-2-2"
app.config['JSON_AS_ASCII'] = False
app.config['TRAP_HTTP_EXCEPTIONS'] = True

r = FlaskRedis(app, decode_responses=True)
# =========================================================================== #


# =========================== GAME PARAMETERS =============================== #
player_required_fields = ['name', 'avatar', 'pushToken']
score_keys = ['balances', 'emissions', 'trees']
score_field_map = {'balances': 'balance', 'emissions': 'co2', 'trees': 'trees'}
initial_scores = {'balances': 20, 'emissions': 0, 'trees': 0}
total_co2 = 0
co2_per_tree = 1
cooldown_secs = 10
initial_co2 = 0
initial_pts_per_trade = 10
initial_co2_per_trade = 10
initial_pts_per_tree = 1
prisoners_dilemma_enabled = True
pd_high_value = 10
pd_low_value = 4
# =========================================================================== #


class APIError(Exception):
    status_code = 500

    def __init__(self, message, status_code=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


@app.errorhandler(APIError)
def handle_error(error):
    if not isinstance(error, APIError):
        response = jsonify({'status': 500, 'error': str(error)})
        response.status_code = 500
        return response
    response = jsonify({'status': error.status_code, 'error': error.message})
    response.status_code = error.status_code
    return response


app.register_error_handler(Exception, handle_error)


def reset_game():
    players = r.hkeys('players')
    pipe = r.pipeline()
    pipe.set('prisoners_dilemma', str(prisoners_dilemma_enabled))
    pipe.set('co2', initial_co2)
    pipe.set('co2:tick', initial_co2_per_trade)
    pipe.set('pts:tick', initial_pts_per_trade)
    pipe.set('tree:pts', initial_pts_per_tree)
    pipe.delete(*score_keys)
    for score_key in score_keys:
        for player in players:
            pipe.zadd(score_key, {player: initial_scores[score_key]})
    pipe.execute()


if not r.exists('co2'):
    reset_game()


def write_jwt(client_id):
    return jwt.encode({'id': client_id}, jwt_secret, algorithm='HS256') \
              .decode('utf-8')


def get_client_id():
    auth = request.headers.get('Authorization', None)
    if not auth or not auth.startswith('Bearer '):
        raise APIError('Missing Authorization header', 401)
    raw_jwt = auth.split()[1]
    try:
        decoded = jwt.decode(raw_jwt, jwt_secret, algorithms=['HS256'])
        id = decoded.get('id', None)
        if not id:
            raise APIError('Invalid Authorization header', 401)
        return id
    except:
        print('invalid jwt: {}'.format(raw_jwt))
        raise APIError('Invalid JWT', 401)


def trade_rich_wins(p1_k, p1_pts, p2_k, p2_pts, transaction_id):
    if abs(p1_pts - p2_pts) < 20:
        max_pts = min_pts = 10
    else:
        diff = min(50, int(math.floor(abs(p1_pts - p2_pts))))
        max_pts = int(math.floor(diff / 10) * 7)
        min_pts = diff - max_pts

    poorest = p1_k if p1_pts <= p2_pts else p2_k
    richest = p1_k if p1_pts > p2_pts else p2_k

    pipe = r.pipeline()
    pipe.zincrby('balances', min_pts, poorest)
    pipe.zincrby('emissions', min_pts, poorest)
    pipe.zincrby('balances', max_pts, richest)
    pipe.zincrby('emissions', max_pts, richest)

    pipe.incrby('co2', min_pts + max_pts)
    pipe.hset('tx:{}'.format(transaction_id), 'executed', 1)
    pipe.hdel('player:{}:pending'.format(p2_k), transaction_id)
    pipe.execute()

    p1_result = max_pts if p1_k == richest else min_pts
    p2_result = max_pts if p2_k == richest else min_pts

    # co2 and points are the same
    return ((p1_result, p1_result), (p2_result, p2_result))


def trade_with_dilemma(p1_k, p1_fair, p2_k, p2_fair, transaction_id):
    if p1_fair:
        p1_co2 = pd_low_value if p2_fair else pd_high_value
        p1_pts = pd_low_value
        p2_co2 = pd_low_value
        p2_pts = pd_low_value if p2_fair else pd_high_value
    else:
        p1_co2 = pd_low_value if p2_fair else pd_high_value
        p1_pts = pd_high_value
        p2_co2 = pd_high_value
        p2_pts = pd_low_value if p2_fair else pd_high_value

    pipe = r.pipeline()
    pipe.zincrby('balances', p1_pts, p1_k)
    pipe.zincrby('emissions', p1_co2, p1_k)
    pipe.zincrby('balances', p2_pts, p2_k)
    pipe.zincrby('emissions', p2_co2, p2_k)

    pipe.incrby('co2', p1_co2 + p2_co2)
    pipe.hset('tx:{}'.format(transaction_id), 'executed', 1)
    pipe.hdel('player:{}:pending'.format(p2_k), transaction_id)
    pipe.execute()

    return ((p1_pts, p1_co2), (p2_pts, p2_co2))


def do_trade(p1, p2, transaction_id):
    if r.get('prisoners_dilemma') == 'True':
        return trade_with_dilemma(p1[0], p1[2], p2[0], p2[2], transaction_id)
    else:
        return trade_rich_wins(p1[0], p1[1], p2[0], p2[1], transaction_id)


@app.route('/api/signup', methods=['POST'])
def signup():
    j = request.get_json()
    if not j or any([x not in j for x in player_required_fields]):
        raise APIError('Request does not contain all required fields', 400)

    token_key = 'token:{}'.format(j['pushToken'])
    created = False
    if r.exists(token_key):
        client_id = r.get(token_key)
    else:
        client_id = uuid.uuid4().hex
        j['id'] = client_id

        pipe = r.pipeline()
        pipe.hmset('player:{}'.format(client_id), j)
        pipe.set(token_key, client_id)
        pipe.hset('players',
                  client_id,
                  json.dumps({x: j[x] for x in ['name', 'avatar']}))
        for score_key in score_keys:
            pipe.zadd(score_key, {client_id: initial_scores[score_key]})
        pipe.execute()

        created = True

    return jsonify({
        'success': created, 'id': client_id, 'auth': write_jwt(client_id)
    })


@app.route('/api/trade', methods=['POST'])
def trade():
    sender = get_client_id()
    recipient = request.args.get('to')
    player_from = r.hgetall('player:{}'.format(sender))
    recipient_token = r.hget('player:{}'.format(recipient), 'pushToken')
    if not player_from or not recipient_token:
        raise APIError('unknown sender or recipient', 422)
    if sender == recipient:
        raise APIError('You cannot trade with yourself', 403)

    if r.exists('cooldown:{}:{}'.format(sender, recipient)) \
            or r.exists('cooldown:{}:{}'.format(recipient, sender)):
        raise APIError('In cooldown period with player {}'.format(recipient),
                       429)

    j = request.get_json()
    if not j or 'fair' not in j:
        if r.get('prisoners_dilemma') == 'True':
            raise APIError('You must choose your fairness', 400)
        else:
            fair = True
    else:
        fair = j['fair']

    r.setex('cooldown:{}:{}'.format(sender, recipient),
            cooldown_secs,
            int(time.time()))

    tx_id = uuid.uuid4().hex
    r.hmset('tx:{}'.format(tx_id),
            {'from': player_from['id'], 'to': recipient, 'fair': str(fair)})

    r.hmset('player:{}:pending'.format(recipient), {tx_id: int(time.time())})

    push(recipient_token,
         'Confirm trade transaction',
         '{} ({}) has asked to trade with you. Please confirm the transaction'
         .format(player_from['name'], player_from['id']))

    return jsonify({'success': True, 'tx': tx_id})


@app.route('/api/confirm/<transaction_id>', methods=['POST'])
def confirm(transaction_id):
    tx_key = 'tx:{}'.format(transaction_id)
    tx = r.hmget(tx_key, 'from', 'to', 'executed', 'fair')
    if not tx:
        raise APIError('Unknown transaction', 422)

    j = request.get_json()
    if not j or 'fair' not in j:
        if r.get('prisoners_dilemma') == 'True':
            raise APIError('You must choose your fairness', 400)
        else:
            p2_fair = True
    else:
        p2_fair = j['fair']

    p1, p2, executed, p1_fair = tx
    p1_fair = p1_fair.lower() == 'true'

    if p2 != get_client_id() or executed == 1:
        raise APIError('Transaction already executed' if executed == 1
                       else 'Only {} can confirm this transaction'.format(p2),
                       403)

    print('{} => {} tx {}, exec: {}, p1_fair: {}, p2_fair: {}'
          .format(p1, p2, transaction_id, executed, p1_fair, p2_fair))

    pipe = r.pipeline()

    for p in [p1, p2]:
        pipe.zscore('balances', p)
    p1_b, p2_b = pipe.execute()

    p1_result, p2_result = do_trade((p1, int(p1_b), p1_fair),
                                    (p2, int(p2_b), p2_fair),
                                    transaction_id)
    p1_pts, p1_co2 = p1_result
    p2_pts, p2_co2 = p2_result

    print('p1 gets {}, p2 gets {}'.format(p1_pts, p2_pts))

    p1_token = r.hget('player:{}'.format(p1), 'pushToken')
    if not p1_token:
        print('WARNING! Tried to notify {} about {}, but no push token is set'
              .format(p1, tx))
    else:
        p2_name = r.hget('player:{}'.format(p2), 'name')
        push(p1_token,
             'Trade successful!',
             '{} confirmed your transaction, so you gained {} points emitting '
             '{} tons of CO₂, while {} gained {} points and emitted {} tons '
             'of CO₂'
             .format(p2_name, p1_pts, p1_co2, p2_name, p2_pts, p2_co2))

    return jsonify({'success': True, 'points': p2_pts, 'co2': p2_co2,
                    'otherPoints': p1_pts, 'otherCo2': p1_co2})


@app.route('/api/plant/<int:quantity>', methods=['POST'])
def plant_tree(quantity):
    client = get_client_id()
    points_needed = int(r.get('tree:pts')) * quantity
    balance = r.zscore('balances', client)
    if balance is None:
        raise APIError('Unknown player', 403)
    balance = int(balance)
    print('{} wants to plant {} tree(s), pts needed: {}, balance: {}'
          .format(client, quantity, points_needed, balance))

    if balance < points_needed:
        raise APIError('{} points needed, balance is {}'
                       .format(points_needed, balance), 403)

    pipe = r.pipeline()
    pipe.zincrby('balances', -points_needed, client)
    pipe.zincrby('trees', quantity, client)
    pipe.incrby('co2', -co2_per_tree * quantity)

    new_balance, new_trees, new_co2 = pipe.execute()

    return jsonify({
        'success': True, 'balance': int(new_balance), 'globalCO2': int(new_co2)
        })


@app.route('/api/status', methods=['GET'])
def get_status():
    client = get_client_id()
    pipe = r.pipeline()
    for score_key in score_keys:
        pipe.zscore(score_key, client)

    scores = pipe.execute()
    if any([x is None for x in scores]):
        raise APIError('unknown client', 403)
    balance, co2, trees = scores
    global_co2 = r.get('co2')
    pending = r.hkeys('player:{}:pending'.format(client))
    return jsonify({
        'balance': int(balance), 'co2': int(co2), 'globalCO2': int(global_co2),
        'trees': int(trees), 'pending': pending
    })


@app.route('/api/players', methods=['GET'])
def list_players():
    players = r.hgetall('players')
    decoded = {k: json.loads(v) for k, v in players.items()}

    pipe = r.pipeline()
    for score_key in score_keys:
        pipe.zrangebyscore(score_key, '-inf', '+inf',  withscores=True,
                           score_cast_func=lambda x: int(x))
    balances, emissions, trees = pipe.execute()

    for k, v in zip(score_keys, [balances, emissions, trees]):
        for player, score in v:
            # score_field_map has entries like 'emissions': 'co2'
            decoded[player][score_field_map[k]] = score

    return jsonify(decoded)


@app.route('/api/pending', methods=['GET'])
def list_pending():
    client = get_client_id()
    transactions = []
    pending = r.hgetall('player:{}:pending'.format(client))
    if pending:
        pipe = r.pipeline()
        for tx in pending.keys():
            pipe.hget('tx:{}'.format(tx), 'from')
        senders = pipe.execute()
        pipe = r.pipeline()
        for sender in senders:
            pipe.hmget('player:{}'.format(sender), 'id', 'name', 'avatar')
        senders = pipe.execute()
        transactions = {
            tx: {'from': {'id': s[0], 'name': s[1], 'avatar': s[2]}}
            for s, tx in zip(senders, pending.keys())}
        transactions = OrderedDict(sorted(transactions.items(),
                                          key=lambda x: pending[x[0]]))
    return jsonify({'pending': transactions})


@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    pipe = r.pipeline()
    for score_key in score_keys:
        pipe.zrevrangebyscore(score_key, '+inf', '-inf',  withscores=True,
                           score_cast_func=lambda x: int(x))
    balances, emissions, trees = pipe.execute()
    players = r.hgetall('players')
    decoded = {k: json.loads(v) for k, v in players.items()}
    return jsonify({'players': decoded, 'balances': balances,
                    'emissions': emissions, 'trees': trees});


@app.route('/leaderboard')
def crappy_html_leaderboard():
    pipe = r.pipeline()
    for score_key in score_keys:
        pipe.zrevrangebyscore(score_key, '+inf', '-inf',  withscores=True,
                           score_cast_func=lambda x: int(x))
    balances, emissions, trees = pipe.execute()
    players = r.hgetall('players')
    decoded = {k: json.loads(v) for k, v in players.items()}
    b_list = ['<li><b>{}</b> - points: {}</li>'
              .format(decoded[b[0]]['name'], b[1])
              for b in balances]
    e_list = ['<li><b>{}</b> - CO2: {}</li>'
              .format(decoded[e[0]]['name'], e[1]) for e in emissions]
    t_list = ['<li><b>{}</b> - trees: {}</li>'
              .format(decoded[t[0]]['name'], t[1]) for t in trees]
    return '<html><h3>points</h3><ol>{}</ol><h3>trees</h3><ol>{}</ol>' \
           '<h3>emissions</h3><ol>{}</ol></html>'.format(''.join(b_list),
                                                         ''.join(t_list),
                                                         ''.join(e_list))


@app.route('/api/private/reset', methods=['POST'])
def reset():
    if request.headers.get('Bananas', None) != 'Schoko':
        abort(401)
    reset_game()
    return jsonify({'success': True})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    serve = path
    if not path or path.find('.') == -1 or \
            path[path.rfind('.'):] not in serve_extensions:
        serve = 'index.html'
    return app.send_static_file(serve)


if __name__ == '__main__':
    app.run(host='0.0.0.0')
