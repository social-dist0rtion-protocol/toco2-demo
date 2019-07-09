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
total_co2 = 0
co2_per_tree = 1
cooldown_secs = 60
initial_co2 = 0
initial_pts_per_trade = 10
initial_co2_per_trade = 10
initial_pts_per_tree = 1
initial_player_balance = 20
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
    r.set('co2', initial_co2)
    r.set('co2:tick', initial_co2_per_trade)
    r.set('pts:tick', initial_pts_per_trade)
    r.set('tree:pts', initial_pts_per_tree)


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
        j['co2'] = 0
        j['trees'] = 0
        j['balance'] = initial_player_balance
        r.hmset('player:{}'.format(client_id), j)
        r.set(token_key, client_id)
        r.hset('players',
               client_id,
               json.dumps({x: j[x] for x in ['name', 'avatar']}))
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

    r.setex('cooldown:{}:{}'.format(sender, recipient),
            cooldown_secs,
            int(time.time()))

    tx_id = uuid.uuid4().hex
    r.hmset('tx:{}'.format(tx_id),
            {'from': player_from['id'], 'to': recipient})

    r.hmset('player:{}:pending'.format(recipient), {tx_id: int(time.time())})

    push(recipient_token,
         'Confirm trade transaction',
         '{} ({}) has asked to trade with you. Please confirm the transaction'
         .format(player_from['name'], player_from['id']))

    return jsonify({'success': True, 'tx': tx_id})


@app.route('/api/confirm/<transaction_id>', methods=['POST'])
def confirm(transaction_id):
    tx_key = 'tx:{}'.format(transaction_id)
    print(tx_key)
    tx = r.hmget(tx_key, 'from', 'to', 'executed')
    if not tx:
        raise APIError('Unknown transaction', 422)

    p1, p2, executed = tx
    print('p1: {}, p2: {}, exec: {}'.format(p1, p2, executed))
    if p2 != get_client_id() or executed == 1:
        raise APIError('Transaction already executed' if executed == 1
                       else 'Only {} can confirm this transaction'.format(p2),
                       403)

    pts = int(r.get('pts:tick'))
    co2 = int(r.get('co2:tick'))

    for p in [p1, p2]:
        k = 'player:{}'.format(p)
        r.hincrby(k, 'balance', pts)
        r.hincrby(k, 'co2', co2)

    r.incrby('co2', 2 * pts)
    r.hset(tx_key, 'executed', 1)
    r.hdel('player:{}:pending'.format(p2), transaction_id)

    p1_token = r.hget('player:{}'.format(p1), 'pushToken')
    if not p1_token:
        print('WARNING! Tried to notify {} about {}, but no push token is set'
              .format(p1, tx))
    else:
        push(p1_token,
             'Trade successful!',
             '{} confirmed your transaction {}, so you gained {} points!'
             .format(p2, transaction_id, pts))

    return jsonify({'success': True, 'points': pts, 'co2': co2})


@app.route('/api/plant/<int:quantity>', methods=['POST'])
def plant_tree(quantity):
    client = get_client_id()
    player_key = 'player:{}'.format(client)
    points_needed = int(r.get('tree:pts')) * quantity
    balance = int(r.hget(player_key, 'balance'))
    print('{} wants to plant {} tree(s), pts needed: {}, balance: {}'
          .format(client, quantity, points_needed, balance))

    if balance < points_needed:
        raise APIError('{} points needed, balance is {}'
                       .format(points_needed, balance), 403)
    new_balance = int(r.hincrby(player_key, 'balance', -points_needed))
    new_co2 = int(r.incrby('co2', -co2_per_tree * quantity))
    r.hincrby(player_key, 'trees', quantity)
    return jsonify({
        'success': True, 'balance': new_balance, 'globalCO2': new_co2
        })


@app.route('/api/status', methods=['GET'])
def get_status():
    client = get_client_id()
    balance, co2 = r.hmget('player:{}'.format(client), 'balance', 'co2')
    if not balance or not co2:
        raise APIError('unknown client', 403)
    global_co2 = r.get('co2')
    pending = r.hkeys('player:{}:pending'.format(client))
    return jsonify({
        'balance': int(balance), 'co2': int(co2), 'globalCO2': int(global_co2),
        'pending': pending
        })


@app.route('/api/players', methods=['GET'])
def list_players():
    players = r.hgetall('players')
    decoded = {k: json.loads(v) for k, v in players.items()}
    for player, values in decoded.items():
        values['balance'], values['co2'], values['trees'] =\
            r.hmget('player:{}'.format(player), 'balance', 'co2', 'trees')
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
