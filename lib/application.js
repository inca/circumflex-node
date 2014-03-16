'use strict';

var _ = require('underscore')
  , express = require('express')
  , http = require('http')
  , async = require('async');

var Configuration = require('./configuration')
  , RequestExt = require('./request-ext');

/**
 * A constructor for Circumflex application.
 *
 * @param conf Circumflex Configuration or its `options` object
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
   * Application is designed to run behind a reverse proxy (nginx).
   */
  app.set('trust proxy', true);

  /**
   * Request logger is installed in development.
   */
  if (!conf.production)
    app.use(require('morgan')(conf.loggerOptions || 'dev'));

  /**
   * Attach CORS headers.
   */
  app.use(require('./middleware/cors')(conf));

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
  app.use(require('./middleware/notices')(conf));

  /**
   * Assets manager.
   */
  if (conf.assets)
    app.use(require('./middleware/assets')(conf));

  /**
   * Main application routing.
   */
  app.use(conf.router);

  /**
   * Stylus compiler.
   */
  app.use(require('stylus').middleware({
    src: conf.dir('public'),
    compile: require('./stylus-renderer')
  }));

  /**
   * Static files server.
   */
  app.use(express.static(conf.dir('public')));

  /**
   * Error handler.
   */
  app.use(require('errorhandler')(conf.errorHandler || {}));

  /**
   * Shutdown handlers are invoked sequentially when application
   * exists via SIGTERM, SIGINT or via `app.shutdown()`;
   */
  app._shutdownHandlers = [];

  /**
   * Runs an application with `node-cluster`, attaching a process hook
   * for graceful shutdown.
   *
   * @param cb {Function} Callback function
   */
  app.run = function(cb) {
    var server = this._server = http.createServer(this);
    process.on('SIGINT', app.shutdown);
    process.on('SIGTERM', app.shutdown);
    server.listen(app.conf.port, cb);
  };

  /**
   * Shuts down application gracefully, executing `onShutdown` hooks.
   */
  app.shutdown = function() {
    if (!app._server)
      return;
    if (app._shuttingDown)
      return;
    app._shuttingDown = true;
    app._server.close(function() {
      async.series(app._shutdownHandlers, function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        delete app._server;
        delete app._shuttingDown;
        process.exit(0);
      });
    });
  };

  /**
   * Adds a shutdown handler.
   *
   * @param handler {Function} `function(next) { ... }`
   */
  app.onShutdown = function(handler) {
    app._shutdownHandlers.push(handler);
  };

  /**
   * Automatically add a shutdown hook if Redis is configured.
   */
  if (conf.redis && conf.redis.client)
    app.onShutdown(function(next) {
      conf.redis.client.quit();
      next();
    });

  /**
   * Returning application instance.
   */
  return app;

};
