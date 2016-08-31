from django.contrib import admin
from .models import Meeting


# Register your models here.
class MeetingAdmin(admin.ModelAdmin):
    list_display = ['creator', 'timezone', 'duration', 'end_date', 'meeting_url', ]


admin.site.register(Meeting, MeetingAdmin)
