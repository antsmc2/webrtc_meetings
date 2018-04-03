__author__ = 'anthony'

import cPickle as pickle


class Attendant(object):

    def __init__(self, **kwargs):
        self._info = kwargs

    def __getitem__(self, key):
        return self._info[key]  # can throw key error

    def dumps(self):
        return pickle.dumps(self._info)

    @classmethod
    def loads(cls, string):
        return pickle.loads(string)