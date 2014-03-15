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

  var sessionConf = _.extend({ key: 'sid' }, conf.session || {});

  /**
   * If Redis configuration is available, use it to store sessions.
   */
  if (conf.redis && conf.redis.client) {
    var RedisStore = require('connect-redis')(session);
    sessionConf.store = new RedisStore({
      prefix: 'session:',
      ttl: (conf.session && conf.session.ttl) || 600,
      client: conf.redis.client
    });
  }

  return session(sessionConf)
};