__author__ = 'anthony'
from model_utils.models import TimeStampedModel

class Base(TimeStampedModel):
    '''
        This would be the base models for all models. Incase there is need to add project wide model features
    '''
    pass

    class Meta:
        abstract = True