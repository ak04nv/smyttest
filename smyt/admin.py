from django.contrib import admin
from django.db import models

# Register your models here.
from smyt.models import __models__

for m in __models__:
    admin.site.register(m)
