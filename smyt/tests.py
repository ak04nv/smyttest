from django.test import Client, TestCase
from django.core.urlresolvers import reverse

from smyt.forms import FORM_MAP
from smyt.models import MODEL_MAP, get_field_type
from smyt.views import get_items

import json
from datetime import date

class SimpleTest(TestCase):
    fixtures = ['smyt_data.json']
    conv = lambda self, x: json.loads(x.decode('utf-8'))
    data_map = {
        'int': 12345,
        'char': 'Огурец солёный',
        'date': date.today().strftime('%Y-%m-%d')
    }

    def setUp(self):
        self.client = Client()

    def test_details(self):
        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, 200)

    def test_view_items(self):
        for k, v in MODEL_MAP.items():
            response = self.client.get(reverse('view-items', args=(k,)))
            json_data = self.conv(response.content)
            self.assertEqual(json_data['ok'], 1)
            self.assertEqual(json_data['model'], k)

    def test_add_item(self):
        for k, v in FORM_MAP.items():
            data = {}
            for f in v().visible_fields():
                data[f.name] = ''
            response = self.client.post(reverse('add-item', args=(k,)), data)
            json_data = self.conv(response.content)
            self.assertEqual(json_data['ok'], 1)
            self.assertEqual('errs' in json_data, True)

            for f in v().visible_fields():
                data[f.name] = self.data_map[get_field_type(k, f.name)]
            response = self.client.post(reverse('add-item', args=(k,)), data)
            json_data = self.conv(response.content)
            self.assertEqual(json_data['ok'], 1)
            for v in data.values():
                self.assertEqual(v in json_data['item'][1], True)

    def test_update_item(self):
        for k, v in FORM_MAP.items():
            obj = MODEL_MAP[k].objects.get(pk=1)
            for f in v().visible_fields():
                data = {
                    'fname': f.name,
                    f.name: ''
                }
                response = self.client.post(reverse('update-item', args=(k, obj.id)), data)
                json_data = self.conv(response.content)
                self.assertEqual(json_data['ok'], 1)
                self.assertEqual('errs' in json_data, True)

                data = {
                    'fname': f.name,
                    f.name: self.data_map[get_field_type(k, f.name)]
                }
                response = self.client.post(reverse('update-item', args=(k, obj.id)), data)
                json_data = self.conv(response.content)
                self.assertEqual(json_data['ok'], 1)
                self.assertEqual(json_data['value'], str(data[f.name]))
