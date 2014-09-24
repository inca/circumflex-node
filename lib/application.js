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
   * Main application router is accessible via `main` property.
   */
  app.main = new express.Router();

  /**
   * Request prototype is extended to provide parameter handling helpers.
   */
  _.extend(express.request, RequestExt);

  /**
   * Application supports Jade and EJS views located in `./views` directory
   * (relative to `conf.root`).
   */
  app.set('views', conf.path('views'));
  app.set('view engine', 'jade');
  app.set('view options', {
    basedir: conf.path('views')
  });
  app.engine('ejs', require('ejs').renderFile);
  app.locals.basedir = conf.path('views');

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
  app.use(require('./middleware/multipart')());
  app.use(require('body-parser').urlencoded({ extended: false }));
  app.use(require('body-parser').json());
  app.use(require('method-override')());

  /**
   * Standard cookies parser.
   */
  app.use(require('cookie-parser')(conf.cookies && conf.cookies.secret || conf.root));

  /**
   * Cookie-based session backed by Redis.
   */
  if (conf.redis)
    app.use(require('circumflex-session')(conf));

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
   * Bind local variables (just before the main routing)
   */
  app.use(require('./middleware/locals')(conf));

  /**
   * Main application routing.
   */
  app.use(app.main);

  /**
   * Stylus compiler.
   */
  app.use(require('stylus').middleware({
    src: conf.path('public'),
    compile: require('./stylus-renderer')
  }));

  /**
   * Static files server.
   */
  app.use(express.static(conf.path('public')));

  /**
   * Error handler.
   */
  if (conf.development)
    app.use(require('errorhandler')());

  /**
   * Run handlers are invoked before the application starts with `app.run()`.
   */
  app._runHandlers = [];

  /**
   * Shutdown handlers are invoked sequentially when application
   * exists via SIGTERM, SIGINT or via `app.shutdown()`;
   */
  app._shutdownHandlers = [];

  /**
   * Runs an application attaching a process hook for graceful shutdown.
   *
   * @param cb {Function} Callback function
   */
  app.run = function(cb) {
    var app = this;
    async.series(app._runHandlers, function(err) {
      if (err)
        console.trace(err);
      var server = app._server = http.createServer(app);
      process.on('SIGINT', app.shutdown);
      process.on('SIGTERM', app.shutdown);
      server.listen(app.conf.port, function() {
        conf.log('Listening on %s.', conf.port);
        conf.log('Type %s in browser omnibox to begin.', conf.origin);
        if (typeof cb == 'function')
          cb();
      });
    });
  };

  /**
   * Adds a run handler. Run handlers are executed by `app.run()` in order
   * they are defined.
   *
   * @param handler {Function} `function(next) { ... }`
   */
  app.onRun = function(handler) {
    app._runHandlers.push(handler.bind(app));
  };

  /**
   * Shuts down application gracefully, executing `onShutdown` hooks.
   */
  app.shutdown = function() {
    conf.log('Shutting down.');
    if (!app._server)
      return;
    if (app._shuttingDown)
      return;
    app._shuttingDown = true;
    async.series(app._shutdownHandlers, function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      delete app._server;
      delete app._shuttingDown;
      process.exit(0);
    });
  };

  /**
   * Adds a shutdown handler.
   *
   * @param handler {Function} `function(next) { ... }`
   */
  app.onShutdown = function(handler) {
    app._shutdownHandlers.push(handler.bind(app));
  };

  /**
   * Your routes are automatically read from `routes.js` or `routers/index.js`.
   */
  process.nextTick(function() {
    var routesPath = conf.path('routes');
    try {
      require(routesPath);
    } catch (e) {
      if (e.code == 'MODULE_NOT_FOUND')
        conf.log('Place your routes into `routes.js` or `routers.js`.');
      else console.trace(e);
    }
  });

  /**
   * Returning application instance.
   */
  return app;

};
