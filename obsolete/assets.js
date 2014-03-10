'use strict';

var path = require('path')
  , fs = require('fs')
  , crypto = require('crypto')
  , mkdirp = require('mkdirp');

module.exports = function(app) {

  var conf = app.conf
    , assetsJson = path.join(conf.publicPath, 'assets.json')
    , assetsCache = {};

  function init() {
    if (process.env.NODE_ENV == 'production')
      try {
        assetsCache = JSON.parse(
          fs.readFileSync(assetsJson, { encoding: 'utf-8' }));
        return;
      } catch(e) {
        console.warn(assetsJson + " missing or broken.");
      }
    // Fallback to default multi-files markup
    initDev();
  }

  function initDev() {
    for (var bundleName in conf.assets) {
      if (!conf.assets.hasOwnProperty(bundleName))
        continue;
      var tags = assetsCache[bundleName] = { js: '', css: '' };
      conf.assets[bundleName].forEach(function(asset) {
        if (/\.js$/i.test(asset)) {
          tags.js +=
            '<script type="text/javascript" src="' +
              asset + '"></script>';
        } else if (/\.css/i.test(asset)) {
          tags.css +=
            '<link rel="stylesheet" type="text/css" href="' +
              asset + '"/>';
        }
      });
    }
  }

  init();

  // Ensure assets conf
  if (!conf.assets) {
    console.warn('Configure `conf.assets` with your CSS and JS files.');
  }

  return function(req, res, next) {
    res.locals.emitJs = function(bundleName) {
      return assetsCache[bundleName].js;
    };
    res.locals.emitCss = function(bundleName) {
      return assetsCache[bundleName].css;
    };
    next();
  };

};

module.exports.compile = function(app) {

  var conf = app.conf
    , assetsJson = path.join(conf.publicPath, 'assets.json')
    , assetsCache = {};

  function md5(str) {
    var p = crypto.createHash('md5');
    p.update(str, 'utf-8');
    return p.digest('hex');
  }

  for (var bundleName in conf.assets) {
    if (!conf.assets.hasOwnProperty(bundleName))
      continue;
    console.log('Processing ' + bundleName);
    var jsFiles = []
      , cssFiles = [];
    // Collect filenames
    conf.assets[bundleName].forEach(function(asset) {
      var file = path.join(conf.publicPath, asset);
      if (/\.js$/i.test(asset)) {
        jsFiles.push(file);
      } else if (/\.css/i.test(asset)) {
        cssFiles.push(file);
      }
    });
    // Concatenate them
    var scripts = '';
    jsFiles.forEach(function(f) {
      scripts += fs.readFileSync(f, { encoding: 'utf-8' });
    });
    var stylesheets = '';
    cssFiles.forEach(function(f) {
      stylesheets += fs.readFileSync(f, { encoding: 'utf-8' });
    });
    // Collect fingertips
    var jsFile = 'generated/' +
      bundleName + '_' + md5(scripts).substring(0, 8) + '.js';
    var cssFile = 'generated/' +
      bundleName + '_' + md5(stylesheets).substring(0, 8) + '.css';
    // Write them
    mkdirp.sync(path.join(conf.publicPath, 'generated'));
    console.log('Writing ' + jsFile  + ' and ' + cssFile);
    fs.writeFileSync(path.join(conf.publicPath, jsFile),
      scripts, { encoding: 'utf-8' });
    fs.writeFileSync(path.join(conf.publicPath, cssFile),
      stylesheets, { encoding: 'utf-8' });
    // Write HMTL tags
    assetsCache[bundleName] = {
      js: '<script type="text/javascript" src="' +
        app.cdnOrigin + '/' + jsFile + '"></script>',
      css: '<link rel="stylesheet" type="text/css" href="' +
        app.cdnOrigin + '/' + cssFile + '"/>'
    }
  }

  // Finally, write cached HTML tags

  console.log('Writing assets.json.');
  fs.writeFileSync(assetsJson, JSON.stringify(assetsCache), { encoding: 'utf-8' });

};