var nonEuMembers;

Number.isFinite = Number.isFinite || function(value) {
  return typeof value === 'number' && isFinite(value);
};

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
var countryGroups;

function filterCountriesById(countries, filterIds) {
  var features = {
    type: 'FeatureCollection',
    features: []
  };
  countries.forEach(function(c) {
    if (filterIds.indexOf(c.name) === -1) {
      return;
    }
    features.features.push(c);
  });
  return features;
}


function travelToOppositeMutator(start, viewport, delta) {
  // point: the point we want to mutate
  // start: starting point (the initial anchor point)
  // viewport: array of width, height
  // delta: array of dimensions to travel

  var center = findCenter(viewport);

  var dirx = start[0] > center[0] ? -1 : 1;
  var diry = start[1] > center[1] ? -1 : 1;

  return function(point) {
    var res = [
      point[0] + delta[0] * dirx,
      point[1] + delta[1] * diry
    ];
    return res;
  };
}


function findCenter(viewport) {
  return [viewport[0] / 2, viewport[1] / 2];
}


function getMapletStartingPoint(
  viewport,   // an array of two integers, width and height
  startPoint, // an array of two numbers, x, y for position in viewport
  index,      // integer, position in layout
  side,       // one of ['top', 'bottom', 'left', right']
  spacer,     // integer with amount of space to leave between Maplets
  boxDim,      // array of two numbers, box width and box height
  titleHeight // height of title box
) {

  // return value is array of x,y
  // x: horizontal coordinate
  // y: vertical coordinate

  var bws = boxDim[0] + spacer;   // box width including space to the right
  var bhs = boxDim[1] + spacer + titleHeight;

  var mutator = travelToOppositeMutator(startPoint, viewport, [bws, bhs]);

  var mutPoint = [startPoint[0], startPoint[1]];

  for (var i = 0; i < index; i++) {
    mutPoint = mutator(mutPoint, index);
  }

  // TODO: this could be improved, there are many edge cases
  switch (side) {
    case 'top':
      mutPoint[1] = startPoint[1];
      break;
    case 'bottom':
      mutPoint[1] = startPoint[1] - bhs;
      break;
    case 'left':
      mutPoint[0] = startPoint[0];
      break;
    case 'right':
      mutPoint[0] = startPoint[0] - bws;
      break;
  }

  return {
    x: mutPoint[0],
    y: mutPoint[1]
  };
}


function drawCountries(
  svg,        // d3 selector for a svg element
  x,          // coordinate in svg for x
  y,          // coordinate in svg for y
  width,      // width of desired map
  height,     // height of desired map
  countries,  // topojson with country as features
  focusIds,   // country ids where we zoom focus
  projection, // desired projection (ex: mercator projection d3 object)
  graticules, // array of graticules and css classes
              //    [[gr1, 'main-lines'], [gr2, 'secondary-lines]]
  zoomLevel   // correction factor for zoom
) {
  // Draw the countries in the specified viewport

  var focusCountriesFeature = filterCountriesById(countries, focusIds);

  var path = d3.geoPath().projection(projection);   // the path transformer

  var cprectid = makeid();
  var defs = svg.append('defs');

  defs
    .append('clipPath')
    .attr('id', cprectid)
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('height', height)
    .attr('width', width)
  ;

  var g = svg
    .append('g')
    .attr('class', 'country-maps')
    .attr('clip-path', 'url(#' + cprectid + ')')
  ;

  var b = path.bounds(focusCountriesFeature);

  // var vRatio = window.vRatio;
  var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
  var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
  var s =  zoomLevel / Math.max(cwRatio, chRatio);
  var t = [
    (width - s * (b[1][0] + b[0][0])) / 2 + x,
    (height - s * (b[0][1] + b[1][1])) / 2 + y
  ];
  projection.scale(s).translate(t);

  g     // the world sphere, acts as ocean
    .append("path")
    .datum(
      {
        type: "Sphere"
      }
    )
    .attr("class", "sphere")
    .attr("d", path)
  ;

  graticules = graticules || [];

  if (graticules.length) {
    var grat = g
      .append('g')
      .attr('class', 'ggroup')
      .selectAll('path')
    ;

    graticules.forEach(function(gc) {
      grat
        .data(gc[0].lines())
        .enter()
        .append('path')
        .attr('class', gc[1])
        .attr('x', x)
        .attr('y', y)
        .attr('d', path)
      ;
    });
  }


  // draw all countries
  g
    .append('g')
    .selectAll('path')
    .data(countries)
    .enter()
    .append('path')
    .attr('id', function(d) {
      return 'c-' + cprectid + '-' + d.id;
    })
    .style("fill", function(d) {
      if ($('.maes-map').length > 0) {
        for (var i = 0; i < countryGroups.length; i++) {
          var c = countryGroups[i]['countries'];
          if (c.indexOf(d.name) > -1) {
            return countryGroups[i]['color'];
          }
        }
      }
    })
    .attr('class', function(d) {
      if ($('.maes-map').length > 0) {
        if (focusIds.indexOf(d.name) > -1) {
          return 'country-stroke country-focus';
        }
      }
      return 'country-stroke';
    })
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;


  d3.selectAll(".countries-checkbox").on("change", update);
  update();

  function update () {
    if ($('.general-map').length > 0) {
      d3.selectAll('.country-stroke').attr('class', function(d) {
        var euCountries = window.available_map_countries.indexOf(d.name) > -1;
        var nonEuCountries = nonEuMembers.indexOf(d.name) > -1;

        // focus eu members on the map
        if (d3.select("#checkb_1").property("checked")) {
          if (euCountries) {
            return 'country-stroke country-focus';
          }
        } else if (d3.select("#checkb_2").property("checked")) {
          // focus non-eu members on the map
            if (nonEuCountries) {
              return 'country-stroke non-eu-country-focus';
            }
        } else if (d3.select("#checkb_3").property("checked")) {
          // focus all countries on the map
            if (nonEuCountries) {
              return 'country-stroke non-eu-country-focus';
            }
            if (euCountries) {
              return 'country-stroke country-focus';
            }
        }
        return 'country-stroke';
      })
    }
  }


  // define clipping paths for all focused countries
  defs
    .selectAll('clipPath')
    .data(countries)
    .enter()
    .append('clipPath')
    .attr('id', function(d) {
      return 'cp-' + cprectid + '-' + d.id;
    })
    .append('path')
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;

  var imgs = svg.append('g');
  imgs
    .attr('class', 'flag-images')
    .selectAll('image')
    .attr('class', 'country-flags')
    .data(focusCountriesFeature.features)
    .enter()
    .append('image')
    .attr('href', function(d) {
      return d.url;
    })
    .attr('class', 'country-flag')
    .attr('clip-path', function(d) {
      return 'url(#cp-' + cprectid + '-' + d.id + ')';
    })
    .attr("x", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.x;
    })
    .attr("y", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.y;
    })
    .attr("width", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.width;
    })
    .attr("height", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.height;
    })
    .attr("preserveAspectRatio", "none")
    .attr('opacity', function() {
      return window.isHeaderMap ? '1' : '0';
    })
    .on('mouseover', function(d) {
      if (window.isHeaderMap) return;
      d3.select(this).attr('opacity', 1);
      var current_position = d3.mouse(this);
      var tooltip = $('#tooltip');
      if ($('#tooltip').length > 0) {
        tooltip.html(d.name);
        tooltip.css({
          'left': (current_position[0]) + 'px',
          'top': (current_position[1]) + 'px',
          'display': 'block'
        });
      }
    })
    .on('mouseout', function(d) {
      if (window.isHeaderMap) return;
      d3.select(this).attr('opacity', 0);
      $('#tooltip').css({
        'display': 'none'
      });
    })
    .on('click', function(d) {
      if (window.isHeaderMap) return;
      //
      // handleClick(d);
      if (window.available_map_countries.indexOf(d.name) > -1) {
        var link = d.name.toLowerCase();
        location.href = link;
        return true;
      }
    })
  ;
}

function drawCountriesForMinimap(
  svg,        // d3 selector for a svg element
  x,          // coordinate in svg for x
  y,          // coordinate in svg for y
  width,      // width of desired map
  height,     // height of desired map
  countries,  // topojson with country as features
  focusIds,   // country ids where we zoom focus
  projection, // desired projection (ex: mercator projection d3 object)
  zoomLevel   // correction factor for zoom
) {
  // Draw the countries in the specified viewport

  var focusCountriesFeature = filterCountriesById(countries, focusIds);

  var path = d3.geoPath().projection(projection);   // the path transformer

  var cprectid = makeid();
  var defs = svg.append('defs');

  defs
    .append('clipPath')
    .attr('id', cprectid)
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('height', height)
    .attr('width', width)
  ;

  var g = svg
    .append('g')
    .attr('class', 'country-maps')
    .attr('clip-path', 'url(#' + cprectid + ')')
  ;

  var b = path.bounds(focusCountriesFeature);

  // var vRatio = window.vRatio;
  var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
  var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
  var s =  zoomLevel / Math.max(cwRatio, chRatio);
  var t = [
    (width - s * (b[1][0] + b[0][0])) / 2 + x,
    (height - s * (b[0][1] + b[1][1])) / 2 + y
  ];
  projection.scale(s).translate(t);

  g     // the world sphere, acts as ocean
    .append("path")
    .datum(
      {
        type: "Sphere"
      }
    )
    .attr("class", "sphere")
    .attr("d", path)
  ;

  // draw all countries
  var rect = g
    .append('g')
    .selectAll('path')
    .data(countries)
    .enter()
    .append('path')
    .attr('id', function(d) {
      return 'c-' + cprectid + '-' + d.id;
    })
    .attr('class', function(d) {
      if (focusIds.indexOf(d.name) > -1) {
        return 'country-stroke minimap-country-focus';
      }
      return 'country-stroke';
    })
    .on('mouseover', function(d) {
      $('path.minimap-country-focus').attr('class', 'country-stroke minimap-country')
      var current_position = d3.mouse(this);
      var tooltip = $('#tooltip');
      if ($('path.minimap-country').length > 0) {
        if ($('#tooltip').length > 0) {
          tooltip.html('European Union');
          tooltip.css({
            'left': (current_position[0]) + 10 + 'px',
            'top': (current_position[1]) + 10 + 'px',
            'display': 'block'
          });
        }
      }
    })
    .on('mouseout', function(d) {
      $('path.minimap-country').attr('class', 'country-stroke minimap-country-focus')
      $('#tooltip').css({
        'display': 'none'
      });
    })
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;

  // define clipping paths for all focused countries
  defs
    .selectAll('clipPath')
    .data(countries)
    .enter()
    .append('clipPath')
    .attr('id', function(d) {
      return 'cp-' + cprectid + '-' + d.id;
    })
    .append('path')
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;
}


// TODO: we need to detect if we need to hide the maplets for small res
function addComposedCountryToMap(
  svg,
  viewport,
  countries,
  focusId,
  index,
  startPoint,
  side,
  projection,
  zoomLevel
) {
  // Adds a zoom to the desired country, added to the left side of the map
  //
  // cf = correction factor, based on index in left side rendering
  //
  //      box width
  //  |  |-----|
  //  |  |     | box height
  //  |  |     |
  //  |  |-----|
  //  | spacer
  //  ---------------

  var boxw = 60;
  var boxh = 60;
  var spacer = 20;
  var boxtitle = 10;

  if (!index) {
    index = 0;
  }

  var msp = getMapletStartingPoint(
    viewport,
    startPoint,
    index,
    side,
    spacer,
    [boxw, boxh],
    boxtitle
  );

  drawCountries(
    svg,
    msp.x,
    msp.y,
    boxw,
    boxh,
    countries,
    [focusId],
    projection,
    [],
    zoomLevel
  );

  svg
    .append('rect')
    .attr('class', 'maplet-outline')
    .attr('x', msp.x)
    .attr('y', msp.y)
    .attr('width', boxw)
    .attr('height', boxh)
    .append('text')
    .html(index)
  ;

  var countryName = countries.filter(function(d) {
    return d.name === focusId;
  })[0].name;

  var label = svg.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('class', 'country-focus-label')
    .attr('text-anchor', 'middle')
    .text(countryName)
  ;

  var lbbox = label.node().getBBox();
  var textboxh = lbbox.height + lbbox.height / 4;

  label
    .attr('x', msp.x + boxw/2)
    .attr('y', msp.y - textboxh / 3)
  ;

  svg
    .append('rect')
    .attr('class', 'country-focus-text-bg')
    .attr('x', msp.x)
    .attr('y', msp.y - textboxh)
    .attr('width', boxw)
    .attr('height', textboxh)
  ;

  label.raise();

}

function addCountriesToMinimap(
  svg,
  viewport,
  countries,
  focusId,
  startPoint,
  side,
  projection,
  zoomLevel
) {

  var boxw = 150;
  var boxh = 150;
  var spacer = 0;
  var boxtitle = 10;

  var msp = getMapletStartingPoint(
    viewport,
    startPoint,
    side,
    spacer,
    [boxw, boxh],
    boxtitle
  );

  drawCountriesForMinimap(
    svg,
    msp.x,
    msp.y,
    boxw,
    boxh,
    countries,
    focusId,
    projection,
    zoomLevel
  );

  svg
    .append('rect')
    .attr('class', 'maplet-outline minimap')
    .attr('x', msp.x)
    .attr('y', msp.y)
    .attr('width', boxw)
    .attr('height', boxh)
    .append('text')
  ;


  var label = svg.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('class', 'country-focus-label')
    .attr('text-anchor', 'middle')
    .text('European Union')
  ;

  var lbbox = label.node().getBBox();
  var textboxh = lbbox.height + lbbox.height / 4;

  label
    .attr('x', msp.x + boxw/2)
    .attr('y', msp.y - textboxh / 3)
  ;

  svg
    .append('rect')
    .attr('class', 'country-focus-text-bg')
    .attr('x', msp.x)
    .attr('y', msp.y - textboxh)
    .attr('width', boxw)
    .attr('height', textboxh)
  ;

  var img = svg.append('g');
  img
    .append('image')
    .attr('class', 'eu-flag')
    .attr('x', msp.x + 10)
    .attr('y', msp.y - textboxh + 22)
    .attr('width', 40)
    .attr('height', 27)
    .attr('href', 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg')
  ;

  label.raise();

}

function fLoc(fname) {
  return window.location.origin + "/++resource++bise.country/js/countries/" + fname;
}


function setCountryNames(countries) {
  countries.forEach(function(d) {
    d.name = d.properties.name;
  });
}

function setCountryFlags(countries, flags) {
  countries.forEach(function(c) {
    var cname = c.name.replace(' ', '_');
    flags.forEach(function(f) {
      if (f.url.indexOf(cname) > -1) {
        c.url = f.url;
      }
    });
  });
}


function init(settings) {
  // console.log("initializing using settings: ", settings);
  countryGroups = settings['filteredCountries'];
  nonEuMembers = settings.nonEuMembers;
  var getCountries = [];

  d3.select("body").select("#countryfactsheets-map svg").selectAll("*").remove();
  $("#countries-filter").detach();

  var $sw = $('#countryfactsheets-map');
  // countries filter legend for MAES map
  var $dw = $('<div id="countries-filter">' +
    '<span>Report on MAES-related <br> developments</span>' +
    '<ul class="filter-listing"></ul></div>');
  // helper tooltip for maps
  var $tt = $('<div id="tooltip"/>');
  $sw.append($dw);
  $sw.append($tt);

  for (var i = 0; i < countryGroups.length; i++) {
    var $dbox = $('<li><div class="color-box"/><span class="type-title"/></li>');
    $('.filter-listing').append($dbox);
    var eqColor = $('#countries-filter ul li div').eq(i);
    var eqTitle = $('.type-title').eq(i);
    eqColor.css('background-color', countryGroups[i]['color']);
    eqTitle.text(countryGroups[i]['title']);
    getCountries.push(countryGroups[i]['countries']);
  }

  var showLegend = $("#countryfactsheets-map").data('show-legend');

  if (showLegend === false) {
    $('#countries-filter').hide();
  }

  var showMapFilter = $("#countryfactsheets-map").data('show-map-filter');

  if (showMapFilter === false) {
    $('.eu-map-filter').hide();
  } else {
    $('.eu-map-filter').show();
  }

  // select only one checkbox at a time
  $(".countries-checkbox").change(function() {
    $('.countries-checkbox').not(this).prop('checked', false);
  });

  var allCountries = [].concat.apply([],getCountries);

  var filteredCountries = allCountries;
  var mapletsCountries = settings['maplets'];
  nonEuMembers = settings['nonEuMembers'];

  $('body').addClass('factsheets');

  window.isHeaderMap = $(".country-header").hasClass('country-header');
  window.isGlobalMap = $("#countryfactsheets-map").data('globalmap') === 'global';

  // get ratio from data attribute
  var zoomLevel = parseFloat($("#countryfactsheets-map").data('ratio'));

  var width = window.isGlobalMap ? $('#countryfactsheets-map svg').width() : $(window).width();
  var height = $('#countryfactsheets-map svg').height();

  if ($('.svg-header-wrapper').length > 0) {
    var $svgh = $('<div class="header-bg"/>');
    var $svg = $('.svg-header-wrapper');
    $svgh.append($svg);
    var $svgw = $svgh.detach();
    var $body = $('#site-body');
    $body.prepend($svgw);
  }

  var wflags = fLoc("countries.tsv");
  var w110 = fLoc("countries.geo.json");

  d3
    .queue()
    .defer(d3.json, w110)
    .defer(d3.tsv, wflags)
    .await(ready);

  function ready(error, world, flags) {   // names,

    if (error) {
      alert('error: ' + error);
      return;
    }

    // read geometry of countries. See https://github.com/topojson/world-atlas
    // countries.geo.json comes from https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json

    var countries = world.features;

    // Augument the countries GeoJSON data with names, bounds and flags
    setCountryNames(countries);
    setCountryFlags(countries, flags);

    var svg = d3
      .select("body")
      .select("#countryfactsheets-map svg")
      .attr("width", width)
    ;

    var gStep = window.isGlobalMap ? [10, 10] : [4, 4];
    var graticule = d3.geoGraticule().step(gStep);
    var minorGraticule = d3.geoGraticule().step([gStep[0]/4, gStep[1]/4]);

    var countries_Id = countries.map(function(d) {
      if (filteredCountries.indexOf(d.name) > -1) {
        return d.name;
      }
    }).filter(function(c) {
      return c;
    });

    window.available_map_countries = countries_Id;

    var globalMapProjection = d3.geoRobinson();   // azimuthalEquidistant conicEquidistant()

    function drawMap() {

      globalMapProjection
        .scale(1)
        .translate([0, 0]);

      drawCountries(
        svg,
        0,
        0,
        width,
        height,
        countries,
        countries_Id,
        globalMapProjection,
        [
          [graticule, 'main-lines'],
          [minorGraticule, 'sub-lines']
        ],
        zoomLevel
      );

      var available_map_country_ids = countries.map(function(d) {
        if (filteredCountries.indexOf(d.name) > -1) {
          return d.name;
        }
      }).filter(function(c) {
        return c;
      });

      if (window.isGlobalMap) {
        var focusCountries = mapletsCountries.split(',');

        var mp = d3.geoPatterson();
        mp
        .scale(1)
        .translate([0, 0]);

        var mside = 'left';
        var mstart = [10, 23];

        if ($('.maes-map').length > 0) {
          addCountriesToMinimap(
            svg,
            [width, height],
            countries,
            countries_Id,
            mstart,
            mside,
            mp,
            0.9
          );
        }

        focusCountries.forEach(function(id, index) {
          if ($('.maes-map').length > 0) {
            orientation =  'bottom';
            start = [10, height + 20];
          } else {
            orientation = 'left';
            start = [10, 26];
            if ((height / width) > 1.2) {
              orientation =  'bottom';
              start = [10, height + 20];
            }
          }

          var p = d3.geoMercator();
          p
          .scale(1)
          .translate([0, 0]);

          if (available_map_country_ids.indexOf(id) > -1) {
            addComposedCountryToMap(
              svg,
              [width, height],
              countries,
              id,
              index,
              start,
              orientation,
              p,

              0.6
            );
          }
        });
      }
    }

    drawMap();

    $(window).resize(function() {
      width = window.isGlobalMap
        ? $('#countryfactsheets-map svg').width()
        : $(window).width()
      ;
      svg.selectAll("*").remove();
      drawMap()
    })
  }
}


$(document).ready(function() {

  var settingsURL = $("#countryfactsheets-map").data('settings');

  d3.json(settingsURL, init);

});
