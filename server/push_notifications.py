#!/usr/bin/env/python
# -*- coding: utf-8 -*-
from exponent_server_sdk import DeviceNotRegisteredError, PushClient, \
        PushMessage, PushResponseError, PushServerError
from requests.exceptions import ConnectionError, HTTPError


log_instead_of_pushing = True


def push(token, title, msg):
    if log_instead_of_pushing:
        print('would send a notification to {} with title "{}" and body "{}"'
              .format(token, title, msg))
        return
    try:
        response = PushClient().publish(
                PushMessage(to=token, title=title, body=msg))
    except PushServerError as e:
        print('got "{}" while sending "{}" to {}'.format(e.errors, msg, token))
    except (ConnectionError, HTTPError) as e:
        print('got a connection error while sending "{}" to {}'
              .format(msg, token))

    try:
        response.validate_response()
        print('sent {} to {}'.format(msg, token))
    except DeviceNotRegisteredError:
        print('{} is inactive'.format(token))
    except PushResponseError as e:
        print('error while sending "{}" to {}: {}'
              .format(msg, token, e.push_response._asdict()))
