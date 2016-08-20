from django.shortcuts import render, get_object_or_404, render_to_response, RequestContext
from django.core.urlresolvers import reverse
from .models import Meeting
from django.utils import timezone
from django.http import HttpResponse
import json
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q

# Create your views here.
def join_meeting(request, room_id):
    meeting = get_object_or_404(Meeting, room_id=room_id, end_date__isnull=True)
    return render_to_response('meeting_room/meeting.html', {
                                            'meeting_uri' : reverse('join_meeting',
                                                                    kwargs={'room_id': room_id}),
                                            'ice_uri' : reverse('get_ice',
                                                                    kwargs={'room_id': room_id}),
                                         },
                                       context_instance=RequestContext(request))


def get_ice(request, room_id):
    meeting = get_object_or_404(Meeting, Q(room_id=room_id), Q(end_date__isnull=True)|
                                                Q(end_date__lte=timezone.now()))
    return HttpResponse(json.dumps(settings.ICE_SERVERS), content_type='application/json')
