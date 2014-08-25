'use strict';

var debug = require('debug')('circumflex:session')
  , session = require('express-session')
  , _ = require('underscore');

/**
 * Constructs a middleware for cookie-based sessions,
 * optionally stored in Redis.
 *
 * @param conf Circumflex Configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  var sessionConf = _.extend({
    key: 'sid',
    saveUninitialized: false,
    resave: false,
    secret: conf.rootgs

  }, conf.session || {});

  /**
   * If Redis configuration is available, use it to store sessions.
   */
  if (conf.redis) {
    var RedisStore = require('connect-redis')(session);
    var cli = require('redis').createClient(conf.redis.port, conf.redis.host, {
      auth_pass: conf.redis.pass || conf.redis.password || conf.redis.auth_pass
    });
    cli.on('error', function(err) {
      console.error(err);
    });
    sessionConf.store = new RedisStore({
      prefix: 'session:',
      ttl: (conf.session && conf.session.ttl) || 600,
      client: cli
    });
  }

  return session(sessionConf)
};
