if (typeof jQuery === 'undefined') {
    throw new Error('TUI后台模块基于jQuery，请检查是否引入jQuery');
}

$(function() {
  $('[data-toggle="tooltip"]').tooltip();

  $('[data-tabs]').on('click', function() {
    $('[data-tabs]').removeClass('active');
    $(this).addClass('active');

    try {
      var tabsArr = $(this).data('tabs').split(','),
          option = {};

      for (var i = 0; i < tabsArr.length; i++) {
          var arr = tabsArr[i].split(':');

          option[arr[0]] = eval('('+ arr[1] +')');
      }

      var id = 'tui-' + option.id,
          title = option.title || $(this).text(),
          url = config.basePath + option.url;

      if ($('.tui-tab-content').find('#' + id).length == 0) {

          $.ajax({
              method: 'GET',
              url: url,
              success: function(result) {
                $('.tui-tabs').find('.active').removeClass('active');
                $('.tui-tab-content').find('.active').removeClass('in active');
                $('.tui-tabs').append('<li role="presentation" class="active"><a href="#'+ id +'" aria-controls="'+ id +'" role="tab" data-toggle="tab">'+ title +'</a><label class="close tui-tabs-close" data-tabid="'+ id +'">&times;</label></li>');
                $('.tui-tab-content').append('<div role="tabpanel" class="tab-pane fade in active" id="'+ id +'">' + result + '</div>');
              },
              error: function(xhr, error, obj) {
                $('.tui-tabs').find('.active').removeClass('active');
                $('.tui-tab-content').find('.active').removeClass('in active');
                $('.tui-tabs').append('<li role="presentation" class="active"><a href="#'+ id +'" aria-controls="'+ id +'" role="tab" data-toggle="tab">'+ title +'</a><label class="close tui-tabs-close" data-tabid="'+ id +'">&times;</label></li>');
                
                $('.tui-tab-content').append('<div role="tabpanel" class="tab-pane fade in active" id="'+ id +'"><h2 style="padding-left: 15px;">url：'+ url +' is Not Found</h2></div>');
              }
          });
      } else {
          $('.tui-tabs').find('.active').removeClass('active');
          $('.tui-tab-content').find('.active').removeClass('in active');

          $('[data-tabid='+ id +']').parent().addClass('active');
          $('#' + id).addClass('in active');
      }

    } catch (e) {
        throw new Error(e);
    }
  });

  // tabs关闭按钮事件
  $('.tui-tabs').delegate('.tui-tabs-close', 'click', function() {
    var tabId = $(this).data('tabid'),
        prevTab = '',
        nextTab = $(this).parent().next(),
        targetClass = $(this).parent().attr('class');

    // 当前是否选中目标tab
    if (targetClass.indexOf('active') !== -1) {

      if (nextTab.length > 0) {

          nextTab.addClass('active');
          $('#' + nextTab.find('label').data('tabid')).addClass('in active');
      } else {

          var childTabSize = $(this).parent().parent().children().length - 1;

          if (childTabSize === 1) {

            $('.tui-tabs>:first-child').addClass('active');
            $('.tui-tab-content>:first-child').addClass('in active');
          } else {

            prevTab = $(this).parent().prev();
            prevTab.addClass('active');
            $('#' + prevTab.find('label').data('tabid')).addClass('in active');
          }
      }
    }

    $('#' + tabId).remove();
    $(this).parent().remove();
  });

  $('.tui-sidebar-a').on('click', function() {
      var next = $(this).next();
      next.slideToggle('fast');
      $('.full-ul').not(next).slideUp('fast');
      return false;
  });

  $('.tui-sidebar-a-mini').on('click', function() {
      var next = $(this).next().next();
      next.slideToggle('fast');
      $('.mini-ul').not(next).slideUp('fast');
      return false;
  });

  $('.tui-sidebar-ul-mini-btn').on('click', function() {
      $('.tui-sidebar').removeClass('tui-sidebar-mini').addClass('tui-sidebar-full');
      $('.tui-content').removeClass('tui-content-mini').addClass('tui-content-full');
      $('.tui-sidebar-ul-mini').hide();
      $('.tui-sidebar-ul-full').fadeIn();
  });

  $('.tui-sidebar-ul-full-btn').on('click', function() {
      $('.tui-sidebar').removeClass('tui-sidebar-full').addClass('tui-sidebar-mini');
      $('.tui-content').removeClass('tui-content-full').addClass('tui-content-mini');
      $('.tui-sidebar-ul-mini').fadeIn();
      $('.tui-sidebar-ul-full').hide();
  });

  // 退出
  $('#quit').on('click', function() {
	  T.Utils.cookie('_esc', null, { expires: -1, path: '/', srcure: true });
	  location.href = config.backendPath + '/login';
  });
  
  // 修改登录密码
  $('#updateBackendLoginPwd').on('click', function() {
    TUI.danger('您点击的是修改登录密码按钮');
  });

  var scroll = 0;

  // tabs 左边按钮
  $('.tui-tabs-left').on('click', function() {
    if (scroll === 0) {
      $('.tui-tabs-wrap').animate({scrollLeft: '0'});
    } else {
      scroll -= 100;
      $('.tui-tabs-wrap').animate({scrollLeft: scroll});
    }
  });

  // tabs 右边按钮
  $('.tui-tabs-right').on('click', function() {
    scroll += 100;
    $('.tui-tabs-wrap').animate({scrollLeft: scroll});
  });
  
});

// 全屏
function fullScreen() {
    $('#fullscreen').attr('onclick', 'exitFullScreen()');

    var el = document.documentElement,
        rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen,
        wscript;
 
    if(typeof rfs != "undefined" && rfs) {
        rfs.call(el);
        return;
    }
 
    if(typeof window.ActiveXObject != "undefined") {
        wscript = new ActiveXObject("WScript.Shell");
        if(wscript) {
            wscript.SendKeys("{F11}");
        }
    }
}

// 退出全屏
function exitFullScreen() {
    $('#fullscreen').attr('onclick', 'fullScreen()');

    var el = document,
        cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen,
        wscript;
 
    if (typeof cfs != "undefined" && cfs) {
      cfs.call(el);
      return;
    }
 
    if (typeof window.ActiveXObject != "undefined") {
        wscript = new ActiveXObject("WScript.Shell");
        if (wscript != null) {
            wscript.SendKeys("{F11}");
        }
    }
}

function loadJS(url, success) {
  var domScript = document.createElement('script');
    domScript.src = url;
    success = success || function(){};
    domScript.onload = domScript.onreadystatechange = function() {
      if (!this.readyState || 'loaded' === this.readyState || 'complete' === this.readyState) {
        success();
        this.onload = this.onreadystatechange = null;
        this.parentNode.removeChild(this);
      }
    }
    document.getElementsByTagName('head')[0].appendChild(domScript);
}