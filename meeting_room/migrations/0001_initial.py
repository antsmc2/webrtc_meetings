# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone
from django.conf import settings
import model_utils.fields
import timezone_field.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created', model_utils.fields.AutoCreatedField(default=django.utils.timezone.now, verbose_name='created', editable=False)),
                ('modified', model_utils.fields.AutoLastModifiedField(default=django.utils.timezone.now, verbose_name='modified', editable=False)),
                ('timezone', timezone_field.fields.TimeZoneField(default=b'UTC')),
                ('activation_date', models.DateTimeField(help_text=b'Choose time when this meeting shall become active')),
                ('duration', models.PositiveIntegerField(help_text=b'Choose duration in minutes for which the meeting shall be active')),
                ('end_date', models.DateTimeField(null=True, editable=False, blank=True)),
                ('room_id', models.CharField(max_length=200, editable=False)),
                ('creator', models.ForeignKey(related_name='meetings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
