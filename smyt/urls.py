from django.conf.urls import patterns, url

urlpatterns = patterns('smyt.views',
    url(r'^$', 'dashboard', name='dashboard'),
    url(r'^(?P<model>\w+)/$', 'view_items', name='view-items'),
    url(r'^(?P<model>\w+)/add/$', 'add_item', name='add-item'),
    url(r'^(?P<model>\w+)/(?P<item_id>\d+)/update/$', 'update_item', name='update-item')
)
