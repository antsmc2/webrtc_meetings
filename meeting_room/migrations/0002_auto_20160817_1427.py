# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('meeting_room', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='meeting',
            name='room_id',
            field=models.CharField(max_length=200, null=True, editable=False, blank=True),
        ),
    ]
