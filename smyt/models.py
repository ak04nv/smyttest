from django.db import models

import yaml

__models__ = []

MODEL_MAP = {}

FIELD_MAP = {
    'int': (models.IntegerField, {}),
    'char': (models.CharField, {'max_length': 255}),
    'date': (models.DateField, {})
}

def get_field_type(model_name, field_name):
    for x in MODEL_DICT[model_name]['fields']:
        if x['id'] == field_name:
            return x['type']
    return 'int' # id field

def make_model(name, data):
    attrs = {'__module__': __name__}
    for f in data['fields']:
        field = FIELD_MAP[f['type']][0](f['title'], \
                **FIELD_MAP[f['type']][1])
        attrs[f['id']] = field
    new_model = type(name, (models.Model,), attrs)
    new_model._meta.verbose_name_plural = data['title']
    return new_model

stream = open('models.yaml', 'r')
MODEL_DICT = yaml.load(stream)

for k, v in MODEL_DICT.items():
    model = make_model(k, v)
    MODEL_MAP[k] = model
    __models__.append(model)
