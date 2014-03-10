'use strict';

var Application = require('./application')
  , express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , multipart = require('./multipart')
  , assets = require('./assets')
  , notices = require('./notices')
  , commons = require('./commons')
  , mongooseAuth = require('./auth')
  , _ = require('underscore')
  , i18n = require("i18n-2");

// Default application skeleton

module.exports = exports = function(conf) {

  // BigFoot Express-based app

  var app = new Application(conf);

  // Views

  app.set('views', conf.viewsPath || './views');
  app.set('view engine', 'jade');
  app.engine('ejs', require('ejs').renderFile);
  app.express.locals.basedir = conf.viewsPath || './views';

  // Loggers

  app.configure('development', function() {
    app.install('logger', express.logger('dev'));
  });

  // Parsers

  app.install('urlencoded', express.urlencoded());
  app.install('json', express.json());
  app.install('multipart', multipart());
  app.install('methodOverride', express.methodOverride());

  // Session with connect-redis or in-memory
  var secret = (conf.session && conf.session.secret) || '';
  var sessionConf = {
    key: 'sid',
    secret: secret,
    cookie: {
      domain: conf.session && conf.session.domain
    }
  };
  if (!conf.redis) {
    console.warn('Specify `conf.redis` with Redis connection settings for sessions.');
  } else {
    var RedisStore = require('connect-redis')(express);
    var redisOptions = _.extend({
      prefix: 'session:',
      ttl: (conf.session && conf.session.ttl) || 600
    }, conf.redis || {});
    sessionConf.store = new RedisStore(redisOptions);
  }
  app.install('cookie', express.cookieParser(secret));
  app.install('session', express.session(sessionConf));

  // Session-based authentication backed by Mongoose

  app.install('auth', mongooseAuth(app));

  // I18n

  app.install('i18n', function(req, res, next) {
    req.i18n = new i18n({
      locales: conf.locales || ['en'],
      extension: '.json'
    });
    i18n.registerMethods(res.locals, req);
    next();
  });

  // Notices

  app.install('notices', notices(app));

  // Assets emitters

  app.install('assets', assets(app));

  // Routing commons

  app.install('commons', commons(app));

  // Router

  app.install('router', app.router);

  // Stylus

  app.install('stylus', stylus.middleware({
    src: conf.publicPath || './public',
    compile: function(str, path) {
      return stylus(str)
        .set('filename', path)
        .set('compress', true)
        .set('include css', true)
        .use(nib());
    }
  }));

  // Public serving

  app.install('public-cors', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', app.origin);
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.install('public', express.static(conf.publicPath));

  // Error handler

  app.configure('development', function() {
    app.install('errors', express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.configure('production', function() {
    app.install('errors', express.errorHandler());
  });

  return app;

};
