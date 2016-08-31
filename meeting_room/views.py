import redis
import json
from django.shortcuts import render, get_object_or_404, render_to_response, RequestContext
from django.core.urlresolvers import reverse
from django.utils import timezone
from django.http import HttpResponse, HttpResponseNotFound
from django.conf import settings
from django.contrib.auth.models import User
from django.core.serializers.json import DjangoJSONEncoder
from .models import Meeting
from service_access.models import ServiceUser
from webrtc_meetings.routing import store as attendance_register
from webrtc_meetings.routing import ONLINE
from model_base.attendant import Attendant
from utils.helpers import get_client_ip
from utils.logger import glogger


# Create your views here.
def join_meeting(request, room_id):
    try:
        meeting = Meeting.get_meeting(room_id)
    except Meeting.DoesNotExist:
        return HttpResponseNotFound()
    return render_to_response('meeting_room/meeting.html', {'ice_uri': reverse('get_ice', kwargs={'room_id': room_id})},
                              context_instance=RequestContext(request))


def get_ice(request, room_id):
    try:
        meeting = Meeting.get_meeting(room_id)
    except Meeting.DoesNotExist:
        return HttpResponseNotFound()
    return HttpResponse(json.dumps(settings.ICE_SERVERS), content_type='application/json')


def online_attendants(request):
    attendants = []
    attendant_datas = attendance_register.hvals(ONLINE)
    map(lambda data: attendants.append(Attendant.loads(data)), attendant_datas)
    return HttpResponse(json.dumps(attendants), content_type='application/json')


def create_room(request):
    try:
        ip, username, password = get_client_ip(request), request.GET['username'], request.GET['password']
        glogger.info('received request: %s, %s, %s' % (ip, username, password))
        duration = int(request.GET['duration'])
        timezone_requested = request.POST.get('timezone', settings.TIME_ZONE)
        user = User.objects.get(username=username)
        if ServiceUser.exists(ip, user, password):
            meeting = Meeting.objects.create(creator=user, timezone=timezone_requested, activation_date=timezone.now(),
                                             duration=duration)
            meeting_url = meeting.meeting_url()     # to generate the meeting url
            return HttpResponse(json.dumps({'creator': username, 'start_date': meeting.activation_date,
                                            'duration': meeting.duration, 'meeting_url': meeting_url},
                                           cls=DjangoJSONEncoder))
    except Exception, ex:
        raise ex
    return HttpResponseNotFound()   # generally give page not found for other failures
