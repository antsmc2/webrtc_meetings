__author__ = 'anthony <>'
from django.conf.urls import include, url
from meeting_room.views import get_ice, join_meeting

#app_name = 'meeting_room'

meeting_room_urls = [
    url(r'^meeting/(?P<room_id>[^/]+)/ice$', get_ice, name='get_ice'),
    url(r'^meeting/(?P<room_id>[^/]+)/$', join_meeting, name='join_meeting'),
]
