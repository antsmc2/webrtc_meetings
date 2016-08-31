__author__ = 'anthony'
import cPickle as pickle

class Attendant(object):


    def __init__(self, ip, port, channel_name, details):
        self._info = {}
        self._info['ip'] = ip
        self._info['port'] = port
        self._info['id'] = channel_name
        self._info['details'] = details

    def __getitem__(self, key):
        return self._info[key] #can throw key error

    @classmethod
    def dumps(cls, instance):
        return pickle.dumps(instance._info)

    @classmethod
    def loads(cls, string):
        return pickle.loads(string)