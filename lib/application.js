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
   * Request logger is installed in development.
   */
  if (!conf.production)
    app.use(require('morgan')('dev'));

  /**
   * Body parsers, method override.
   */
  app.use(require('body-parser')());
  app.use(require('method-override')());
  app.use(require('./middleware/multipart')());

  /**
   * Standard cookies parser.
   */
  app.use(require('cookie-parser')(conf.cookies && conf.cookies.secret || null));

  /**
   * Cookie-based session, optionally backed by Redis.
   */
  app.use(require('./middleware/session')(conf));

  /**
   * Install authentication middleware, if it is configured.
   */
  if (conf.auth)
    app.use(require('./middleware/auth')(conf));

  /**
   * Install I18N modules, if `conf.locales` is defined.
   */
  if (conf.locales)
    app.use(require('./middleware/i18n')(conf));

  /**
   * Notices for displaying disposable messages.
   */
    // TODO add notices middleware
  app.use(require('./middleware/notices')(conf));

  /**
   * Assets manager.
   */
    // TODO add assets middleware
  app.use(require('./middleware/assets')(conf));

  /**
   * Main application routing.
   */
  app.use('router', conf.router);

  /**
   * Stylus compiler.
   */
  app.use(require('stylus').middleware({
    src: conf.dir('public'),
    compile: function(str, path) {
      return require('stylus')(str)
        .set('filename', path)
        .set('compress', true)
        .set('include css', true)
        .use(require('nib')());
    }
  }));

  // TODO revisit HERE!
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', app.origin);
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  /**
   * Static files server.
   */
  app.use(express.static(conf.dir('public')));

  /**
   * Error handler.
   */
  app.use(require('error-handler')(conf.errorHandler || {}));

  /**
   * Returning application instance.
   */
  return app;

};