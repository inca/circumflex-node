'use strict';

var _ = require('underscore');

/**
 * Attaches following application-scope variables to `req` and `res.locals`:
 *
 *   * `req.conf`, `res.locals.conf` -- configuration instance
 *
 * Also attaches everything returned by `conf.locals` function (if defined).
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  return function locals(req, res, next) {
    req.conf = res.locals.conf = conf;
    if (typeof conf.locals == 'function')
      _.extend(res.locals, conf.locals(req, res));
    next();
  };

};