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
  if (conf.redis) {
    var RedisStore = require('connect-redis')(session);
    var redisOptions = _.extend({
      prefix: 'session:',
      ttl: (conf.session && conf.session.ttl) || 600
    }, conf.redis || {});
    sessionConf.store = new RedisStore(redisOptions);
  }

  return session(sessionConf)
};