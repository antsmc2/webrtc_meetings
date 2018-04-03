import uuid
from django.core.urlresolvers import reverse
from django.db import models
from timezone_field import TimeZoneField
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from model_base.base import Base
from datetime import datetime


# Create your models here.
class Meeting(Base):
    creator = models.ForeignKey(User, related_name='meetings', db_index=True)
    timezone = TimeZoneField(default=settings.TIME_ZONE)#
    activation_date = models.DateTimeField(help_text='Choose time when this '
                                                     'meeting shall become '
                                                     'active')
    duration = models.PositiveIntegerField(help_text='Choose duration in '
                                                     'minutes for which the '
                                                     'meeting shall be active')
    end_date = models.DateTimeField(null=True, blank=True, editable=False)
    room_id = models.CharField(max_length=200, editable=False, blank=True,
                               null=True, db_index=True, unique=True)
    description = models.TextField(default='', null=True, blank=True,
                                   help_text='Enter brief description of '
                                             'the meeting (Optional)')

    def _setup(self):
        if self.room_id is None:
            self.room_id = '%s.%s' % (self.creator.id, uuid.uuid4())
            self.save()

    def meeting_url(self):
        """
        This shall avail the url which shall be used to access the meeting room.
        Typically, it shall be available until only until the meeting has ended
        For now, only until there is an it's only when there is an end date.
        :return:
        """
        if self.activation_date < timezone.localtime(timezone.now()):
            self._setup()
            if self.room_id:
                return reverse('join_meeting', kwargs={'room_id': self.room_id})

    @classmethod
    def get_meeting(cls, room_id):
        # throws cls.DoesNotExist
        return cls.objects.get(Q(room_id=room_id),
                               Q(end_date__isnull=True) |
                               Q(end_date__lte=timezone.now()))
