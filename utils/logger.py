__author__ = 'anthony'
import os, sys, logging
from django.conf import settings
from logging import handlers

LOG_ROTATE = 'midnight'
BASE_DIR  = settings.BASE_DIR
formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(message)s')
log_level = logging.DEBUG if settings.DEBUG else logging.INFO

#MODEL LOGGER
LOG_FILE = os.path.join(BASE_DIR, 'logs', 'model.log')
mhandler = handlers.TimedRotatingFileHandler(LOG_FILE, when=LOG_ROTATE)
mhandler.setFormatter(formatter)
mlogger = logging.getLogger("model")
mlogger.addHandler(mhandler)
mlogger.setLevel(log_level)


#MENU SESSION LOGGER
LOG_FILE = os.path.join(BASE_DIR, 'logs', 'websocket.log')
whandler = handlers.TimedRotatingFileHandler(LOG_FILE, when=LOG_ROTATE)
whandler.setFormatter(formatter)
wlogger = logging.getLogger("websocket")
wlogger.addHandler(whandler)
wlogger.setLevel(log_level)

#GENERAL LOGGER
LOG_FILE = os.path.join(BASE_DIR, 'logs', 'general.log')
ghandler = handlers.TimedRotatingFileHandler(LOG_FILE, when=LOG_ROTATE)
ghandler.setFormatter(formatter)
glogger = logging.getLogger("general")
glogger.addHandler(ghandler)
glogger.setLevel(log_level)
