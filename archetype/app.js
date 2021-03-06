'use strict';

var Application = require('circumflex').Application;

var app = module.exports = new Application({

  /**
   * Directories are resolved relative to this directory.
   */
  root: __dirname,

  /**
   * Port for the application to listen on.
   */
  port: '<%= port %>',

  /**
   * Main application host.
   */
  host: {
    development: '127.0.0.1:<%= port %>',
    production: '<%= appName %>'
  },

  /**
   * Base URL for static files.
   */
  staticOrigin: {
    development: '',
    production: '//static.<%= appName %>'
  },

  /**
   * Cookies configuration.
   */
  cookies: {
    secret: 'USE PASSPHRASE TO PROTECT YOUR COOKIES'
  },

  /**
   * Cookie-based sessions stored in Redis.
   *
   * See [connect-redis](https://github.com/visionmedia/connect-redis) for more
   * information.
   */
  session: {
    tti: 600,  // session timeout in seconds
    secret: 'USE PASSPHRASE TO PROTECT YOUR SESSIONS'
  },

  /**
   * Locale codes for i18n middleware. Remove, if you don't use i18n.
   */
  locales: ['en', 'fr', 'ru'],

  /**
   * Redis connection configuration.
   *
   * See [node-redis](https://github.com/mranney/node_redis) for more information.
   */
  redis: {
    host: '127.0.0.1',
    port: '6390'
  },

  /**
   * List of origins for Access-Control-Allow-Origin header.
   */
  allowedOrigins: [
    'http://<%= appName %>',
    'https://<%= appName %>'
  ],

  /**
   * List CSS and JS files for use in your application
   */
  assets: {
    'global': [
      '/css/main.css',
      '/js/app.js'
    ]
  }

});

/**
 * Add shutdown hooks to exit gracefully.
 */
app.onShutdown(function(next) {
  // TODO add code to close all database connections
  next();
});

