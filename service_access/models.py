from hashlib import md5
from django.db import models
from django.contrib.auth.models import User
from model_base.base import Base


# Create your models here.
class ServiceUser(Base):
    '''
        This is used to define users with API access to manage meeting resources.
        Possibly, in the future, there shall be mechanism to define API specific permissions
    '''
    ip = models.GenericIPAddressField(db_index=True)
    user = models.ForeignKey(User, related_name='service_access', db_index=True)
    password = models.CharField(max_length=200)

    @classmethod
    def exists(cls, ip, user, password):
        encrypted = cls.get_encrypted(password)
        result = cls.objects.filter(ip=ip, user=user, password=encrypted).exists()
        return result

    @classmethod
    def get_encrypted(cls, text):
        return md5(text).hexdigest()