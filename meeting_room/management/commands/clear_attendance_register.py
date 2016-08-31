__author__ = 'anthony <antsmc2@gmail.com>'

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from webrtc_meetings.routing import store, ONLINE


class Command(BaseCommand):

    help = 'clears up the attendance register on redis'

    def handle(self, *args, **kwargs):
        self.stdout.write('cleaning attendance register.. ')
        store.delete(ONLINE)
        self.stdout.write('done cleaning!...')
