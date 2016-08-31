__author__ = 'anthony <antsmc2@gmail.com>'
from django.http import HttpResponse, HttpResponseNotFound
from django.contrib.auth.models import User
from django.conf import settings
from service_access.models import ServiceUser
from utils.logger import salogger


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def login_required(func):

    def _challenge():
        response = HttpResponse('');
        response.status_code = 401
        response['WWW-Authenticate'] = 'Basic realm="%s"' % settings.HTTP_AUTH_REALM
        return response

    def _decorator(request, *args, **kwargs):
        ip = get_client_ip(request)
        salogger.debug('request from: %s' % ip)
        if request.META.has_key('HTTP_AUTHORIZATION'):
            authentication = request.META['HTTP_AUTHORIZATION']
            (authmeth, auth) = authentication.split(' ',1)
            if authmeth.lower() == 'basic':
                auth = auth.strip().decode('base64')
                username, password = auth.split(':',1)
                user = User.objects.get(username=username)
                salogger.info('received request: %s, %s, %s' % (ip, username, password))
                if ServiceUser.exists(ip, user, password):
                    return func(request, user, *args, **kwargs)
        return _challenge()
    return _decorator

