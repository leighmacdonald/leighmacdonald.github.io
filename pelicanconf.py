#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

from datetime import datetime

AUTHOR = 'Leigh MacDonald'
SITENAME = 'Midnight in a Perfect World'
SITEURL = ''
AUTHOR_EMAIL = 'leigh.macdonald@gmail.com'

PLUGIN_PATHS = ['../pelican-plugins']
PLUGINS = ['sitemap', 'tag_cloud']

SITEMAP = {
    'format': 'xml',
    'priorities': {
        'articles': 0.5,
        'indexes': 0.5,
        'pages': 0.5
    },
    'changefreqs': {
        'articles': 'monthly',
        'indexes': 'daily',
        'pages': 'monthly'
    }
}

PATH = 'content'

TIMEZONE = 'America/Edmonton'

DEFAULT_LANG = 'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None
BUILD_DATE = datetime.now()
THEME = "./theme"

LINKS = (
    ('Python.org', 'http://python.org/'),
    ('Jinja2', 'http://jinja.pocoo.org/'),)

# Social widget
SOCIAL = (('GitHub', 'https://github.com/leighmacdonald'),
          ('BitBucket', 'https://bitbucket.org/leighmacdonald'),
          'LinkedIn', 'https://www.linkedin.com/in/leighmmacdonald/')

DEFAULT_PAGINATION = 1

# Uncomment following line if you want document-relative URLs when developing
# RELATIVE_URLS = True

MENUITEMS = [('Homepage', '/'), ('Categories', '/categories.html')]
THEME_MENUITEMS = ('fi-home', 'fi-folder')