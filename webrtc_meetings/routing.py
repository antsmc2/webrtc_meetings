__author__ = 'anthony'
import redis
from urlparse import parse_qs
from channels.routing import route
from channels import Channel, Group
#I dont think channel session is needed for now
from channels.sessions import channel_session
from django.core.urlresolvers import get_resolver
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from meeting_room.models import Meeting
from model_base.attendant import Attendant
from utils.logger import wlogger


def get_group(message):
    room_id = message.channel_session['room']
    meeting = Meeting.get_meeting(room_id)
    return Group(settings.ROOM_KEY_FORMAT % {'room_id' : room_id})


@channel_session
def ws_add(message):
    room_id = message['path'].strip('/').split('/')[-1] #to fix later. This implicitly assumes fix ws_url pattern
    wlogger.debug('adding %s'% room_id)
    meeting = Meeting.get_meeting(room_id) #allow ex
    Group(settings.ROOM_KEY_FORMAT % {'room_id' : room_id}).add(message.reply_channel)
    message.channel_session['room'] = room_id
    wlogger.debug('message from: %s, room: %s' % (message, room_id))


@channel_session
def ws_message(message):
    group = get_group(message)
    message_text = message['text']
    wlogger.debug('%s-%s: broadcasting: %s' % (message.reply_channel.name, group.name, message_text))
    group.send({'text': message_text})


@channel_session
def ws_disconnect(message):
    group = get_group(message)
    wlogger.debug('disconnecting %s-%s' % (message.reply_channel.name, group.name))
    group.discard(message.reply_channel)


ONLINE = 'online'
store = redis.Redis(db=int(settings.CACHEOPS_REDIS['db'])+1)


def mark_present(message):
    ip, port = message['client']
    wlogger.info('msg ip: %s, port: %s' % (ip, port))
    a = Attendant(ip=ip, port=port, channel_name=message.reply_channel.name,
                  details=get_request_params(message['query_string']))
    store.hset(ONLINE, message.reply_channel.name, Attendant.dumps(a))


def broadcast_message(message):
    pass


def mark_absent(message):
    store.hdel(ONLINE, message.reply_channel.name)


def get_request_params(request_string):
    params = {}
    for key, value in parse_qs(request_string):
        params[key] = value[0]
    return params


room_url = r'^%s'%get_resolver(None).reverse_dict.get('join_meeting')[1]
wlogger.debug('using room_url: %s' % room_url)
channel_routing = [
    route("websocket.connect", mark_present, path=r"^/attendance/$"),
    route("websocket.disconnect", mark_absent, path=r"^/attendance/$"),
    route("websocket.receive", broadcast_message, path=r"^/attendance/$"),
    route("websocket.connect", ws_add),
    route("websocket.receive", ws_message),
    route("websocket.disconnect", ws_disconnect),
]

