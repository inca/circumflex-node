'use strict';

var path = require('path')
  , fs = require('fs')
  , crypto = require('crypto')
  , mkdirp = require('mkdirp')
  , _ = require('underscore')
  , async = require('async')
  , debug = require('debug')('circumflex:assets');

/**
 * Parses `conf.assets` and returns a descriptor for `assets` middleware
 * suitable for non-production use.
 *
 * @param conf Circumflex configuration
 * @returns {Object} Assets descriptor
 */
exports.parse = function(conf) {
  var descriptor = {};
  for (var bundleName in conf.assets)
    if (conf.assets.hasOwnProperty(bundleName)) {
      var files = conf.assets[bundleName] || [];
      var bundle = descriptor[bundleName] = { js: [], css: [] };
      files.forEach(function(asset) {
        switch (typeof asset) {
          case 'string':
            if (/\.js$/i.test(asset)) {
              bundle.js.push({ src: asset});
            } else if (/\.css/i.test(asset)) {
              bundle.css.push({ href: asset, media: 'screen' });
            }
            break;
          case 'object':
            // Expect CSS descriptor
            bundle.css.push(asset);
            break;
        }
      });
    }
  return descriptor;
};

/**
 * Compiles assets for production environment.
 *
 * JS files are concatenated in specified order.
 *
 * CSS files are also grouped by `media` attribute.
 *
 * **Note** This API is synchronous, so it is only suitable for command-line tool
 * (not for on-the-fly usage).
 *
 * @param conf Circumflex configuration
 * @param cb {Function} Callback `function(err)`
 */
exports.compile = function(conf, cb) {
  var publicPath = conf.dir('public')
    , descriptor = exports.parse(conf);

  function md5(str) {
    var p = crypto.createHash('md5');
    p.update(str, 'utf-8');
    return p.digest('hex');
  }

  function packBundle(bundleName, cb) {
    console.log('Processing ' + bundleName);
    var bundle = descriptor[bundleName]
      , result = { js: [], css: [] }
      , queries = [];

    // Process scripts
    queries.push(function(cb) {
      debug('JS: got %s scripts', bundle.js.length);
      // Read and concatenate 'em
      async.reduce(bundle.js, '', function(scripts, js, cb) {
        var file = path.join(publicPath, js.src);
        fs.readFile(file, 'utf-8', function(err, str) {
          cb(err, scripts + str);
        });
      }, function(err, scripts) {
        if (err) return cb(err);
        // Collect fingerprints
        var jsFile = '/generated/' +
          bundleName + '_' + md5(scripts).substring(0, 8) + '.js';
        console.log('\t' + jsFile);
        result.js.push({ src: jsFile });
        // Write 'em
        fs.writeFile(path.join(publicPath, jsFile), scripts, 'utf-8', cb);
      });
    });

    // Process stylesheets
    queries.push(function(cb) {
      async.series([
        // First compile Stylus files, if they exist
        function(cb) {
          debug('CSS: compiling Stylus files');
          async.each(bundle.css, function(css, cb) {
            var stylFile = path.join(publicPath, css.href.replace(/\.css$/, '.styl'));
            debug(stylFile);
            fs.readFile(stylFile, 'utf-8', function(err, stylText) {
              if (err) return cb(); // Ignoring missing files
              require('../lib/stylus-renderer')(stylText, stylFile)
                .render(function(err, cssText) {
                  if (err) return cb(err);
                  fs.writeFile(path.join(publicPath, css.href), cssText, 'utf-8', cb);
                });
            });
          }, cb);
        },
        // Now group by media
        function(cb) {
          debug('CSS: got %s stylesheets', bundle.css.length);
          var groups = _(bundle.css).groupBy('media');
          async.each(Object.keys(groups), function(media, cb) {
            // Read and concatenate
            async.reduce(groups[media], '', function(stylesheets, css, cb) {
              var file = path.join(publicPath, css.href);
              fs.readFile(file, 'utf-8', function(err, str) {
                cb(err, stylesheets + str);
              });
            }, function(err, stylesheets) {
              if (err) return cb(err);
              // Collect fingerprints
              var cssFile = '/generated/' +
                bundleName + '_' + md5(stylesheets).substring(0, 8) + '.css';
              console.log('\t' + cssFile);
              result.css.push({ href: cssFile, media: media });
              // Write 'em
              fs.writeFile(path.join(publicPath, cssFile), stylesheets, 'utf-8', cb);
            });
          }, cb);
        }
      ], cb);
    });

    // Execute asynchronously
    async.parallel(queries, function(err) {
      if (err) return cb(err);
      cb(null, result);
    });
  }


  // Generated assets are stored in `public/generated`.
  mkdirp(path.join(publicPath, 'generated'), function(err) {
    if (err) return cb(err);
    async.each(Object.keys(descriptor), packBundle, function(err, results) {
      if (err) return cb(err);
      // Write results to assets.json
      var assetsJson = _.extend.apply(_, results);
      console.log('Writing assets.json.');
      fs.writeFile(path.join(publicPath, 'assets.json'),
        JSON.stringify(assetsJson), 'utf-8', cb);
    });
  });

};