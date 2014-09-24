'use strict';

var Application = require('../../lib/application')
  , _ = require('underscore');

var users = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob'}
];

module.exports = new Application({

  root: __dirname,

  port: 8123,

  host: 'circumflexapp.dev',

  staticOrigin: {
    production: '//static.circumflexapp.dev',
    development: ''
  },

  cookies: {
    secret: 'USE PASSPHRASE TO PROTECT YOUR COOKIES'
  },

  session: {
    ttl: 600,  // session timeout in seconds
    secret: 'USE PASSPHRASE TO PROTECT YOUR SESSIONS'
  },

  auth: {
    findUserById: function(id, cb) {
      var u = _(users).findWhere({ id: id });
      cb(null, u);
    },
    getUserId: function(user) {
      return user.id
    },
    defaultLocation: '/protected'
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
  },

  silent: true

});

