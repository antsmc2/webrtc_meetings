from django.contrib import admin
from .models import ServiceUser
from .forms import ServiceUserForm


class ServiceUserAdmin(admin.ModelAdmin):
    list_display = ['ip', 'user']
    form = ServiceUserForm

admin.site.register(ServiceUser, ServiceUserAdmin)