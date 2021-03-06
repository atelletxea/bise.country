// Code for the countries section
// This is also loaded in a country page

$(document).ready(function() {

  // Add claro class for css; used by dojo
  $("body").addClass("claro");

  // Dropdown + tab changing functionality
  // This is the country selector in a country page view

  var getTabFromHash = function(hash) {
    hash = hash.replace('##', '');
    if (hash !== '') {
      var sp = hash.split('-');
      if (sp && sp[0] === 't') {
        currentTab = parseInt(sp[1]);
        return currentTab;
      }
    }
    return -1;
  };

  var currentTab = getTabFromHash(window.location.hash.substr(2));

  $('.custom-dropdown select').change(function() {
    var url = $(this).val()
    if (currentTab > -1) {
      url += "##t-" + currentTab;
    }
    document.location = url;
  });

  $("#country-tabs li").click(function() {
    var element_id = $(this).children('a')[0].hash;
    currentTab = getTabFromHash(element_id)
  });


  // workaround for lazy loading iframes
  $.each($('.fact-contents'), function(index, value) {
    $(value).find("iframe").prop("src", function() {
      return $(this).data("src");
    });
  });

  // center tabs menu items on click on small screen sizes
  $("#country-tabs li a").click(function() {
    var $parent = $(this).parent();
    centerTabItem($parent, 'ul#country-tabs');
  });

  function centerTabItem(target, outer) {
    var outer = $(outer);
    var target = $(target);
    var outerW = outer.width() - 50;
    var targetW = target.outerWidth(true);
    var targetIn = target.index();
    var q = 0;
    var centerElement = outer.find('li');

    for (var i = 0; i < targetIn; i++) {
      q += $(centerElement[i]).outerWidth(true);
    }

    outer.animate({
      scrollLeft: Math.max(0, q - (outerW - targetW) / 2)
    }, 500);
  }

  $('.quick-links-list li').first().remove();

  // tabs functionality
  // $('#country-tabs').each(function () {
  //   var $activeTab, $tabContent, $links = $(this).find('a');
  //   $activeTab = $($links.filter(
  //     '[href="' + location.hash + '"]')[0] || $links[0]
  //   );
  //
  //   $activeTab.parent().addClass('active');
  //   $tabContent = $($activeTab[0].hash);
  //   $links.not($activeTab).each(function () {
  //     $(this.hash).hide();
  //   });
  //
  //   $(this).on('click', 'a', function() {
  //     window.location.hash = this.hash;
  //     $activeTab.removeClass('active');
  //     $tabContent.hide();
  //     $activeTab = $(this);
  //     $tabContent = $(this.hash);
  //     $activeTab.addClass('active');
  //     $tabContent.show();
  //   });
  // });

  $(function() {
    if (window.location.href.indexOf("##") == -1) {
      $('.tab-content #t-0, .nav-tabs li:first-child').addClass('active');
    }
    var hash = window.location.hash;
    hash && $('.nav-tabs a[href="' + hash + '"]').tab('show');

    $('.nav-tabs a').click(function(e) {
       $(this).tab('show');
       window.location.hash = this.hash;
       e.preventDefault();
    });
  });

  $('.tabs-listing').click(function(e) {
    var hash = window.location.hash;
    $('a[href="' + $(this).attr('href') + '"]').tab('show');
    window.location.hash = this.hash;
    e.preventDefault();
});

  // make green infrastracture content collapsible on country pages
  var $htitle =  $('.content-green-infrastructure #parent-fieldname-text h2');
  var $subTitle =  $('.content-green-infrastructure #parent-fieldname-text h3');

  $htitle.each(function (index) {
    $(this).nextUntil($htitle).wrapAll("<div class='gi-content-wrapper'/>");
    $(this).wrap("<div class='gi-title-wrapper'/>");
  });

  $subTitle.each(function (index) {
    $(this).nextUntil($subTitle).wrapAll("<div class='gi-sub-content-wrapper'/>");
    $(this).wrap("<div class='gi-sub-title-wrapper'/>");
  });

  var $icon = $('<i class="fa fa-plus"/>');
  $('.gi-title-wrapper').append($icon);

  $('.gi-title-wrapper') .click(function() {
    $(this).nextUntil('.gi-title-wrapper').slideToggle('slow');
    $("i", this).toggleClass("fa-plus fa-minus");
  });

  var $sicon = $('<i class="sub--plus-icon fa fa-plus"/>');
  $('.gi-sub-title-wrapper').append($sicon);
  $('.gi-sub-title-wrapper') .click(function() {
    $(this).nextUntil('.gi-sub-title-wrapper').slideToggle('slow');
    $("i", this).toggleClass("fa-plus fa-minus");
  });


  // edit page of biodiversity factsheets
  $(function() {
    $('#country-select').change(function() {
      $('form').submit();
      })
  });

  var mainTitle = $('.main-title').text();
  var mainTitle = mainTitle.charAt(0).toUpperCase() + mainTitle.slice(1);
  var mainTitle = 'Biodiversity factsheet for' +  ' ' + mainTitle;
  $('.main-title').text(mainTitle);

  $('.fact-section a[href$="/@@simple-edit"]').prepOverlay(
     {
      subtype: 'ajax',
      filter: common_content_filter,
      formselector: 'form.kssattr-formname-simple-edit',
      closeselector: 'input#form-buttons-cancel[name="form.buttons.cancel"]',
      noform: 'reload',
     }
  );


  // contributions sidebar
  $('.anchor-link').hide();
  var $smwrap = $('<div id="mtr-wrapper" class="mtr-container"/>');
  var $srow = $('<div id="srow" class="row"/>');
  var $swrap = $('<div id="mtr-main-wrapper" class="tab-content col-md-9 "/>');
  var $mwrap = $('<div class="i-sticky mobile-only mobile-sidebar"><div class="mobile-content">Contributions Menu <i class="fa fa-bars" aria-hidden="true"></i></div></div>');

  $('.country-table').wrapAll($smwrap);
  $('.country-table').wrapAll($srow);
  $('.country-table').wrapAll($swrap);

  var $wrapper = $('#srow');

  $mwrap.insertBefore(".country-table");

  var _gtarc = 0; // global counter for name targets

  $(function() {
    var $sidebar = $('#sidebar-wrapper');
    var sections = [];

    $('tr').each(function() {
      var $tr = $(this);
      var section_title = $('h2', this).text();
      var cl = $tr.attr('class');

      if (cl && cl.indexOf('target') !== -1) {
        var section_descr = $('td:nth-child(2) p', this).text();
        $tr.addClass('targetTitle');
      }

      if (section_title) {
        sections.push([section_title, section_descr, []]);
      }

      $('td', this).each(function() {
        var $td = $(this);
        var klass = $td.attr('class');
        var text = $td.text().trim();

        if (text.indexOf('Action') === 0) {
          var getChar = text.charAt(7);
          var conChar = parseInt(getChar);
          if (!isNaN(conChar)) {
            _gtarc += 1;
            $td.attr('id', 'gtarc-' + _gtarc);
            sections[sections.length - 1][2].push([text, [_gtarc]]);
          }
        }
      })

    });

    var $ssidebar = $('<div id="sidebar-wrapper" class="i-sticky col-md-3 sidebar"/>');
    var $menu = $('<ul class="nav-list nav-menu-list-style"/>');
    var $mclose = $('<div class="mobile-only close-sidebar"><i class="fa fa-times" aria-hidden="true"></i></div>');

    $ssidebar.append($mclose);
    $ssidebar.append($menu);
    $wrapper.append($ssidebar);

    for (var i = 0; i < sections.length; i++) {

      var sectionTitle = sections[i][0].toString().slice(3).trim();
      var sectionTitle = sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1).toLowerCase();
      var sectionDescr = sections[i][1];
      var targetID = sectionTitle.slice(-1);

      var loc = 'eu-target-' + targetID;
      var $sa = $('<p/>');
      $sa.data('wloc', loc)
      // $sa.on('click', function() {
      //   document.location.hash = $(this).data('wloc');
      // });

      $sa.text(sectionTitle);
      var $sp = $('<p/>');
      $sp.text(sectionDescr);
      var $ss = $('<a class="tree-toggle nav-header"/>').attr('href', document.location.pathname + '#' + loc);
      $ss.append($sa);
      $ss.append($sp);
      var $sli = $('<li/>');
      $sli.append($ss);
      $menu.append($sli);
      var sectionActions = sections[i][2];
      var $sul = $('<ul class="nav-list trees bullets"/>');
      $sli.append($sul);

      for (var j = 0; j < sectionActions.length; j++) {
        var action = sectionActions[j][0];
        var subText = action.split(':');
        var subTitle = subText[0];
        var subDescription = subText[1];
        var actionID = sectionActions[j][1];
        var navActionTitle = $('<p class="action-title"/>').text(subTitle);
        var navActionDescription = $('<p class="action-description" />').text(subDescription);
        var $sp = $('<a/>').attr('href', document.location.pathname + '#gtarc-' + actionID).append(navActionTitle, navActionDescription);
        var $ali = $('<li/>');
        $ali.append($sp);
        $sul.append($ali);
      }
    }

    if ($('.mtr-container tr').hasClass('targetTitle')) {
      $tdp = $('.targetTitle td:first-child p');
      $tdp.css('display', 'none');
    }

    $('.mtr-container b').filter(function() {
      return $.trim($(this).text()) === '' && $(this).children().length == 0
    }).remove();

    $('p').filter(function() {
      return $.trim($(this).text()) === '' && $(this).children().length == 0
    }).remove();

    var aLink = $('.mtr-container .anchor-link');

    if (aLink.css('display') == 'none') {
      aLink.css('display', 'block');
    }

    if ($('.country-table table').width() > 500) {
      $('.country-table table').css("width", "100%");
    }

    $("#mtr-main-wrapper").insertAfter("#sidebar-wrapper");

    // show/hide sidebar on mobile
    $('.mobile-sidebar, .close-sidebar').click(function(e) {
      e.stopPropagation();
      $('#sidebar-wrapper').toggleClass("toggle-sidebar");
    });

    $('body').click(function() {
      if ($('#sidebar-wrapper').hasClass('toggle-sidebar')) {
        $("#sidebar-wrapper").toggleClass('toggle-sidebar')
      }
    })

    $('.i-sticky').iSticky(); // activate sticky plugin/polyfill for sidebar

    $('.sidebar li ul li a').click(function() {
      if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
        $('#sidebar-wrapper').hide();
      }
    });

    $('.sidebar a').click(function() {
      var anchID = $(this).attr('href');
      var anchID = anchID.split('#')[1];
      var anchID = '#' + anchID;

      if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
        var target = $(anchID).offset().top + (-60);
      } else {
        var target = $(anchID).offset().top;
      }

      $('html, body').animate({
        scrollTop: target
      }, 500);

      return false;
    });


    // highlight current sidebar item on scroll
    $(window).scroll(function() {
      position = $(this).scrollTop(); // get the current vertical position of the scroll bar

      $('.sidebar a').each(function() {
        var anchID = $(this).attr('href');
        var anchID = anchID.split('#')[1];
        var anchID = '#' + anchID;
        var target = $(anchID).offset().top + (-35);

        if (position >= target) {
          $('.sidebar a').removeClass('selected');
          $(this).addClass('selected');
        }
      })

      // toggle  current sidebar item on scroll
      $('.nav-header').each(function() {
        var anchID = $(this).attr('href');
        var anchID = anchID.split('#')[1];
        var anchID = '#' + anchID;
        var target = $(anchID).offset().top + (-35);

        if (position >= target) {
          $('.tree-toggle').parent().children('ul.trees').hide();
          $(this).parent().children('ul.trees').show();
        }
      })
    })

  })

});
