'use strict';

var _ = require('underscore')
  , express = require('express')
  , http = require('http')
  , async = require('async')
  , debug = require('debug')('circumflex');

var Configuration = require('iconf');

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
   * Augment configuration with `origin`.
   */
  conf.add('origin', 'http://' + conf.host, true);

  /**
   * Main application router is accessible via `main` property.
   */
  app.main = new express.Router();

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
    app.use(require('morgan')('dev', conf.loggerOptions));

  /**
   * Attach CORS headers.
   */
  try {
    app.use(require('circumflex-cors')(conf));
  } catch (e) {
    if (e.code == 'MODULE_NOT_FOUND')
      debug('circumflex-cors not found');
    else console.trace(e);
  }

  /**
   * Request parsing and extending.
   */
  app.use(require('expressr')());

  /**
   * Standard cookies parser.
   */
  app.use(require('cookie-parser')(conf.cookies && conf.cookies.secret || conf.root));

  /**
   * Cookie-based session backed by Redis.
   */
  if (conf.redis)
    app.use(require('alt-session')(conf));

  /**
   * Install authentication middleware, if it is configured.
   */
  if (conf.auth)
    app.use(require('alt-auth')(conf.auth));

  /**
   * Install I18N modules, if `conf.locales` is defined.
   */
  if (conf.locales)
    app.use(require('./middleware/i18n')(conf));

  /**
   * Notices for displaying disposable messages.
   */
  try {
    app.use(require('circumflex-notices')(conf));
  } catch (e) {
    if (e.code == 'MODULE_NOT_FOUND')
      debug('circumflex-notices not found');
    else console.trace(e);
  }

  /**
   * Assets manager.
   */
  if (conf.assets) {
    if (!conf.assets.root)
      conf.assets.root = conf.path('public');
    app.use(require('circumflex-assets')(conf));
  }

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
        console.log('Listening on %s.', conf.port);
        console.log('Type %s in browser omnibox to begin.', conf.origin);
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
    console.log('Shutting down.');
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
   * Your routes are automatically read from `routes.js` or `routes/index.js`.
   */
  process.nextTick(function() {
    var routesPath = conf.path('routes');
    try {
      require(routesPath);
    } catch (e) {
      if (e.code == 'MODULE_NOT_FOUND')
        console.log('Place your routes into `routes.js` or `routes/index.js`.');
      else console.trace(e);
    }
  });

  /**
   * Returning application instance.
   */
  return app;

};
