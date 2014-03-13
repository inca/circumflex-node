'use strict';

var path = require('path')
  , fs = require('fs')
  , crypto = require('crypto')
  , mkdirp = require('mkdirp')
  , _ = require('underscore');

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
      var bundle = descriptor[bundleName] = { js: [], css: [] };
      conf.assets[bundleName].forEach(function(asset) {
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
 */
exports.compile = function(conf) {

  var publicPath = conf.dir('public')
    , descriptor = exports.parse(conf)
    , assets = {};

  function md5(str) {
    var p = crypto.createHash('md5');
    p.update(str, 'utf-8');
    return p.digest('hex');
  }

   // Generated assets are stored in `public/generated`.
  mkdirp.sync(path.join(publicPath, 'generated'));

  for (var bundleName in descriptor)
    if (descriptor.hasOwnProperty(bundleName)) {
      console.log('Processing ' + bundleName);
      var bundle = descriptor[bundleName]
        , target = assets[bundleName] = { js: [], css: [] };
      // Process scripts
      if (bundle.js.length) {
        var scripts = '';
        // Concatenate 'em all
        bundle.js.forEach(function(js) {
          var file = path.join(publicPath, js.src);
          scripts += fs.readFileSync(file, { encoding: 'utf-8' });
        });
        // Collect fingerprints
        var jsFile = '/generated/' +
          bundleName + '_' + md5(scripts).substring(0, 8) + '.js';
        // Write bundle
        console.log('\t' + jsFile);
        fs.writeFileSync(path.join(publicPath, jsFile),
          scripts, { encoding: 'utf-8' });
        // Add it to assets.json
        target.js.push({ src: jsFile })
      }
      // Process stylesheets
      if (bundle.css.length) {
        var groups = _(bundle.css).groupBy('media');
        for (var media in groups)
          if (groups.hasOwnProperty(media)) {
            var stylesheets = ''
              , cssFiles = groups[media];
            // Concatenate CSS files
            cssFiles.forEach(function(css) {
              var file = path.join(publicPath, css.href);
              stylesheets += fs.readFileSync(file, { encoding: 'utf-8' });
            });
            // Collect fingerprints
            var cssFile = '/generated/' +
              bundleName + '_' + md5(stylesheets).substring(0, 8) + '.css';
            // Write bundle
            console.log('\t' + cssFile);
            fs.writeFileSync(path.join(publicPath, cssFile),
              stylesheets, { encoding: 'utf-8' });
            // Add it to assets.json
            target.css.push({ href: cssFile, media: media });
          }
      }

    }

  // Finally, write assets.json to disc
  console.log('Writing assets.json.');
  fs.writeFileSync(path.join(publicPath, 'assets.json'),
    JSON.stringify(assets), { encoding: 'utf-8' });

};
