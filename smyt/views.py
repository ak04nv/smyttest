from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render, get_object_or_404
from django.http import Http404, JsonResponse
from django.core.urlresolvers import reverse

from smyt.models import MODEL_MAP, get_field_type
from smyt.forms import FORM_MAP

from collections import OrderedDict

def get_items(m):
    items = []
    l = []
    for f in m._meta.fields:
        d = {}
        d['name'] = f.name
        d['title'] = f.verbose_name
        d['type'] = get_field_type(m.__name__, f.name)
        d['editable'] = f.name != 'id'
        l.append(d)
        del d
    items.append(l)
    for x in m.objects.all().values_list():
        items.append([reverse('update-item', \
          kwargs={'model': m.__name__, 'item_id': x[0]}), x])
    return items

def view_items(request, model):
    try:
        m = MODEL_MAP[model]
    except KeyError:
        raise Http404
    return JsonResponse({'ok':1, 'model': model, 'items': get_items(m)})


def dashboard(request):
    models = list(MODEL_MAP.keys())
    return render(request, 'index.html', {
      'models': models,
      'items': get_items(MODEL_MAP[models[0]]),
      'forms': FORM_MAP
    })

def add_item(request, model):
    if request.method != 'POST' or model not in MODEL_MAP.keys():
        raise Http404
    form = FORM_MAP[model](request.POST)
    if form.is_valid():
        obj = form.save()
        x = []
        for f in obj._meta.fields:
            x.append(getattr(obj, f.name))
        item = [reverse('update-item', args=(model, obj.id)), x]
        return JsonResponse({'ok': 1, 'item': item})
    return JsonResponse({'ok':1, 'errs': form.errors})

@csrf_protect
def update_item(request, model, item_id):
    if request.method != 'POST' or model not in MODEL_MAP.keys():
        raise Http404
    field = request.POST.get('fname')
    if field is None or field not in \
      (f.name for f in MODEL_MAP[model]._meta.fields):
        raise Http404
    item = get_object_or_404(MODEL_MAP[model], id=item_id)
    form = FORM_MAP[model](request.POST)
    form.is_valid()
    try:
        errs = form.errors[field]
    except KeyError:
        value = form.data[field]
        setattr(item, field, value)
        try:
            item.save()
        except Exception as e:
            print(e)
        return JsonResponse({'ok': 1, 'value': value})
    return JsonResponse({'ok': 1, 'errs': form.errors[field]})
