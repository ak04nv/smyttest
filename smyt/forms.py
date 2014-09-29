from django.forms.models import modelform_factory

from smyt.models import MODEL_MAP, get_field_type

__forms__ = []

FORM_MAP = {}

for key, model in MODEL_MAP.items():
    form = modelform_factory(model, exclude=('id',))
    for name, field in form.base_fields.items():
        ftype = get_field_type(model.__name__, name)
        field.widget.attrs['data-type'] = ftype
        if ftype == 'date':
            field.input_formats.append('%d.%m.%Y')
    __forms__.append(form)
    FORM_MAP[key] = form
