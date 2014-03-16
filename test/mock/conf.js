'use strict';

var Configuration = require('../../lib/configuration');

module.exports = new Configuration({

  root: __dirname,

  port: 8123,

  router: require('./router'),

  host: 'circumflexapp.dev',

  staticHost: 'static.circumflexapp.dev',

  secureHost: 'secure.circumflexapp.dev',

  cookies: {
    secret: 'USE PASSPHRASE TO PROTECT YOUR COOKIES'
  },

  session: {
    ttl: 600,  // session timeout in seconds
    secret: 'USE PASSPHRASE TO PROTECT YOUR SESSIONS'
  },

  errorHandler: {
    dumpExceptions: true,
    showStack: true
  },

  loggerOptions: {
    skip: function() { return true }
  },

  assets: {
    global: [
      '/css/main.css',
      { href: '/css/print.css', media: 'print' },
      '/js/lib.js',
      '/js/app.js'
    ]
  }

});
