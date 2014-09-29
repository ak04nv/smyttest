from django import template

register = template.Library()

@register.filter
def my_date(value):
    return value.strftime('%Y-%m-%d') \
      if hasattr(value, 'strftime') else value
