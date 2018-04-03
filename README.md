# webrtc_meetings

Simple multi participant WebRTC application built on Django Channels.

It supports simple call control features, camera settings adjustments and voice recording.

The application works on the concept of "meetings rooms". Once a meeting room is created,
the respective URL can be shared with all the participants who are interested in joining the call.
The multi-participants webrtc call is only possible so far the room ID is valid.

Solution also implements some server side push mechanism.


## Installation


1. install dependencies by running:

    pip install -r pip-requirements.txt

2. Create the django tables (uses sqllite3 by default)

    ./manage.py makemigrations && ./manage.py migrate && ./manage.py createsuperuser

3. Startup the application from home directory using supervisor:

    supervisord -c supervisor.conf

4. You may now access webrtc meetings admin on http://127.0.0.1:8007/admin

5. You may also use this setup with nginx fronting as a proxy server (ideal for production setups).



## Getting Started.

1. Create a room by invoking the sample URL:

    http://127.0.0.1:8007/reserve_room/?duration=60&timezone="Asia%2FKolkata"

    Duration is time in minutes for which is room continues to be valid.

    Timezone parameter is optional.

    Sample response below:

    {"duration": 60, "meeting_url": "/meeting/2.317f6509-902d-47e9-967f-93880b77d6bc/",
    "description": "", "start_date": "2018-04-03T17:44:21.276+05:30", "creator": "test"}

    meeting_url is the url to use for the call.

    **Note** The API requires you to supply username and password.
    This can be supplied in a basic authentication header

2. Begin webrtc call by sharing the URL to all participants (meeting_url from previous response):

    http://127.0.0.1/meeting/2.317f6509-902d-47e9-967f-93880b77d6bc/


## Server Sent Events support:

Webrtc meetings also supports server side push once you know the channel_name of the peer.

This feature is only available to websockets connected to the /attendance/ url

For example, give below two websockets:

    from websocket import create_connection

    ws = create_connection('ws://127.0.0.1:8007/attendance/?my_id=bob')

    ws2 = create_connection('ws://127.0.0.1:8007/attendance/?my_id=peter')


    To get the list of all onsite websockets, following request should be made:

    GET http://127.0.0.1:8007/online_attendants/

    Response looks like this:

    [{"port": 56786, "channel_name": "daphne.response.UgPuzlDeBz!cgRJARZxNI",
    "ip": "127.0.0.1", "user": "", "details": {"my_id": "peter"}}, {"port": 56768,
    "channel_name": "daphne.response.UgPuzlDeBz!rjJBEjKGmT",
    "ip": "127.0.0.1", "user": "", "details": {"my_id": "bob"}}]

    Basically, anything supplied as query parameter to the websocket URL is made available under details when
    GET http://127.0.0.1:8007/online_attendants/ is invoked (in this case ?my_id=peter and ?my_id=bob).


To push message specifically to "peter", you do that by calling


    GET http://127.0.0.1:8007/notify_ws/daphne.response.UgPuzlDeBz!cgRJARZxNI/?info=hey%20man

With this, ws.recv() receives the message "hey man"





## To do

1. Test cases

2. chat and File sharing is implemented in js files. Need to make visible on UI.

3. Video and voice recording is not working properly yet. Would check when I get the time.

4. Handle server push (discovery and identification) more smoothly.