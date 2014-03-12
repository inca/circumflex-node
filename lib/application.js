'use strict';

var _ = require('underscore')
  , express = require('express');

var Configuration = require('./configuration')
  , RequestExt = require('./request-ext');

/**
 * A constructor for minimalistic Circumflex application.
 *
 * @param conf — Circumflex Configuration or its `options` object
 * @returns {Application} an application instance
 */
var Application
  = module.exports
  = exports
  = function(conf) {

  /**
   * Application is built on top of Express instance.
   */
  var app = express();

  /**
   * Configuration is conventionally required by all Circumflex
   * middleware modules.
   *
   * @type {Configuration}
   */
  app.conf = conf = conf || new Configuration();
  if (conf.constructor != Configuration)
    app.conf = conf = new Configuration(conf);

  /**
   * Request prototype is extended to provide parameter handling helpers.
   */
  _.extend(express.request, RequestExt);

  /**
   * Application supports Jade and EJS views located in `./views` directory
   * (relative to `conf.root`).
   */
  app.set('views', conf.dir('views'));
  app.set('view engine', 'jade');
  app.engine('ejs', require('ejs').renderFile);
  app.locals.basedir = conf.dir('views');

  /**
   * Returning application instance.
   */
  return app;

};