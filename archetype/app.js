'use strict';

var Application = require('circumflex').Application;

module.exports = new Application({

  /**
   * Directories are resolved relative to this directory.
   */
  root: __dirname,

  /**
   * Port for the application to listen on.
   */
  port: 8123,

  /**
   * Main application router.
   */
  router: require('./router/index'),

  /**
   * Main application domain.
   */
  domain: {
    development: '127.0.0.1',
    production: '{{name}}'
  },

  /**
   * Domain for serving static files.
   */
  staticDomain: 'static.{{name}}',

  /**
   * Domain for security-sensitive stuff.
   */
  secureDomain: 'secure.{{name}}',

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
    ttl: 600,  // session timeout in seconds
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
    'http://{{name}}',
    'https://{{name}}'
  ],

  /**
   * Development settings will override other properties in non-production environments.
   */
  development: {

    /**
     * Verbose error handler.
     */
    errorHandler: {
      dumpExceptions: true,
      showStack: true
    },

    /**
     * Override request logging options (see [morgan](https://github.com/expressjs/morgan)).
     */
    loggerOptions: 'dev'

  }

});