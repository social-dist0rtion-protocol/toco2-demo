# Tragedy of the CO₂mmons

A simple demo app to test our algorithms before putting them on a smart contract.

## What's in here

A simple flask server that mocks our smart contract (plus its infrastructure), and a React Native app still to be developed to play with it (which ATM works only on Android, but it be quickly fixed for iOS should we need it -- essentially we just have to replace all `TouchableNativeFeeback` with `TouchableOpacity`).

A Postman collection shows a list of calls that can be made to the server.

## Dependencies and running the backend

To run the flask app you'll need to install [redis][https://redis.io/], and run
the usual

    pip install -r requirements.txt
    python app.py

## Pro-tips

### Backend reset

If you want to wipe the game status, you can run:

    redis-cli -n 2 flushdb

and then either restart the server, or call the `/api/private/reset` (you can use the postman collection to get the request, or just look at the code 😬

### Client reset

On the expo app, you can pull down the expo menu from the notification drawer, tap on the app name, and choose `Clear data`. That will log you off and let you point to another server, should you need it. You might need to restart the app, at least on emulators.

Note that the backend uses the push notification token to identify a device, so if you wipe your data and login to the same server without deleting the player's data on the backend, you're going to login as the same user (and your display name, balance, or carbon footprint won't change).
