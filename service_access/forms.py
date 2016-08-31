__author__ = 'anthony <antsmc2@gmail.com>'
from django import forms
from .models import ServiceUser
from passwords.fields import PasswordField


class ServiceUserForm(forms.ModelForm):
    password = PasswordField(label="Password")

    def clean_password(self):
        password = self.cleaned_data['password']
        return ServiceUser.get_encrypted(password)

    class Meta:
        exclude = []
        model = ServiceUser
