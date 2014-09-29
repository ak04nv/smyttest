function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function my_alert(code, err_msg){
  msg = {
      0: 'Сервер недоступен. Проверьте сетевое соединение.',
    401: 'Вы не авторизованы. Возможно время действия сессии истекло.',
    403: 'Вам запрещён доступ к запрашиваемому документу.',
    404: 'Запрашиваемая Вами страница не найдена на сервере.',
    500: 'Внутренняя ошибка сервера приложения. Попробуйте повторить действие попозже.',
    502: 'Сервер приложения не отвечает на запрос. Попробуйте повторить действие попозже.'
  }

  var el = $( '<div />' )
    .css('width', '50%')
    .css('margin-left', 'auto')
    .css('margin-right', 'auto')
    .addClass('alert alert-dismissable alert-danger navbar-fixed-top')
    .attr('role', 'alert')
    .html( $('<button />')
      .addClass('close')
      .attr('type', 'button')
      .attr('data-dismiss', 'alert')
      .attr('aria-hidden', 'true')
      .html('&times;')
    )
    .append( $('<p />').text(msg[code]))
  $('body > div.container').find('div.alert').alert('close');
  $('body > div.container').prepend(el.fadeIn());
}

$(document).ajaxError(function(event, jqXHR, ajaxSettinga, thrownError){
  try {
     err_msg = jqXHR.responseJSON.msg;
  } catch(e) {
    err_msg = '';
  }
  my_alert(jqXHR.status, err_msg);
});

function init_row(row) {
  var th = $('div#items table th');
  row.find('td').each(function(i) {
    $(this).data('name', $(th[i]).data('name'));
    $(this).data('type', $(th[i]).data('type'));
    $(this).data('editable', $(th[i]).data('editable'));
    if ($(this).data('type') == 'date') {
      var d = new Date();
      d.setTime(Date.parse($(this).data('value')))
      var dd = d.getDate();
      var mm = d.getMonth() + 1;
      dd = (dd < 10) ? '0' + dd : dd;
      mm = (mm < 10) ? '0' + mm : mm;
      var date = dd+'.'+mm+'.'+d.getFullYear();
      $(this).data('value', date).html(date);
    }
  });
}

function init_cells() {
  $('div#items table tr').each(function() {
    init_row($(this));
  });
}

function fill_row(attrs) {
  var row = attrs.row;
  var tbl = attrs.tbl || $('div#items table');
  tbl.find('tbody').append( $('<tr />').data('update-url', row[0]) );
  $.each(row[1], function(j, item) {
    var td = $('<td />').data('value', item).html(item);
    tbl.find('tbody tr:last').append(td);
  });
  init_row(tbl.find('tbody tr:last'));
}

var VALIDATOR_MAP = {
  'int': /\d+/,
  'char': /\D+/,
  'date': /^\d{2}\.\d{2}\.\d{4}$/,
}

function validate_field(field) {
  var err = {};
  if (!field.val())
    err = ['Обязательное поле.'];
  else {
    var validator = VALIDATOR_MAP[field.data('type')];
    if (!validator.test(field.val()))
      err = ['Неправильный формат.'];
  }
  return err;
}

function validate(form) {
  var errs = {};
  form.find('input:visible').each(function(){
    err = validate_field($(this));
    if (!$.isEmptyObject(err))
      errs[$(this).attr('name')] = err;
  });
  return errs;
}

function fill_errors(errs) {
  var ul = $('<ul />');
  $.each(errs, function(i, err) {
    ul.append( $('<li />').text(err) );
  });
  return ul;
}

function fill_form_errors(errs) {
  $.each(errs, function(i, field_errs){
    $('input#id_' + i).after(fill_errors(field_errs));

//    var ul = $('input#id_' + i).next();
//    $.each(field, function(j, err){
//      ul.append( $('<li />').text(err) );
//    })
  })
}

$(document).ready(function(){

    init_cells();

    $(document).on({
      mouseenter: function(){ $(this).css('background-color', '#eaeaea') },
      mouseleave: function(){ $(this).css('background-color', 'white') }
    }, 'div#items table td');

    $(document).on('click', 'div#items table td', function() {
      var cell = $(this);
      if (/^T|true$/.test(cell.data('editable'))) {
        var f = $('<input />')
          .attr('type', 'text')
          .val(cell.data('value'))
          .data('type', cell.data('type'))
          .keydown(function(e) {
            if (e.which == 27) cell.find('input').trigger('focusout');
          })
          .keypress(function(e) {
            if ((e.which == 13) && (cell.data('value') != ($(this).val()))) {
              cell.find('ul').remove();
              var errs = validate_field($(this));
              if (!$.isEmptyObject(errs))
                cell.append(fill_errors(errs));
              else {
                var fname = cell.data('name');
                var data = {fname: cell.data('name')};
                data[fname] = $(this).val();
                $.post(
                  cell.parent('tr').data('update-url'),
                  data,
                  function(resp) {
                    if (resp.ok)
                      if (resp.errs)
                        cell.append(fill_errors(resp.errs))
                      else
                        cell
                          .data('value', resp.value)
                          .text(resp.value);
                  }
                )
              }
            }
          });
        if (cell.data('type') == 'date') {
          f.datepicker({
            dateFormat: "dd.mm.yy",
            onSelect: function() { this.focus() }
          });
          f.focusout(function() {
            if (!$('div#ui-datepicker-div').is(':visible'))
              cell.html(cell.data('value'));
          });
        } else
          f.focusout(function() {
            cell.html(cell.data('value'));
          })
        cell.html(f);
        cell.find('input').focus();
      }
    });

    $('form').submit(function(event){
        var form = $(this);
        form.find('ul').remove();
        errs = validate(form);
        if (!$.isEmptyObject(errs)) {
          fill_form_errors(errs);
          return false;
        }
        $.post(form.attr('action'), form.serializeArray(), function(resp){
            if (resp.ok)
              if (resp.errs) {
                fill_form_errors(resp.errs);
              } else {
                fill_row({row: resp.item});
                form.find('input:visible').val('');
              }
        });
        event.preventDefault();
    });

    $('ul.nav a').on('click', function(){
        $.getJSON($(this).attr('href'), function(resp){
            if (resp.ok) {
                var tbl = $('div#items table')
                  .empty()
                  .append( $('<thead />').append( $('<tr />') ) )
                  .append( $('<tbody />') );
                var thead = resp.items.shift();
                $.each(thead, function(i, item) {
                  tbl.find('thead tr')
                    .append( $('<th />')
                      .data('name', item.name)
                      .data('type', item.type)
                      .data('editable', item.editable)
                      .html(item.title)
                    )
                });
                $.each(resp.items, function(i, row) {
                  fill_row({row: row, tbl:tbl});
                });
                $('li.active').removeClass('active');
                $('li#link-' + resp.model ).addClass('active');
                $('form:visible').hide();
                $('form#form-' + resp.model).show();
            };
        });
        return false;
    });

    $('input[name^="date"]').datepicker({ dateFormat: "dd.mm.yy" });

})
