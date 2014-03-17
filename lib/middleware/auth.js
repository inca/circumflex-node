'use strict';

var debug = require('debug')('circumflex:auth');

/**
 * Simple session-based authentication middleware.
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  return function auth(req, res, next) {

    /**
     * Associates current session with specified `user`.
     *
     * Uses `conf.auth.getUserId(user)` function to map user to its ID.
     *
     * @param user {*} User object (database record, document, whatever)
     * @param cb {Function} Callback
     */
    req.login = function(user, cb) {
      var id = conf.auth.getUserId(user);
      if (id) {
        req.session.principalId = id.toString();
      }
      if (typeof cb == 'function')
        cb();
    };

    /**
     * Removes an association between current session and authenticated user.
     *
     * @param cb {Function} Callback
     */
    req.logout = function(cb) {
      delete req.session.principalId;
      if (typeof cb == 'function')
        cb();
    };

    /**
     * Stores current location (URL) in a cookie. Used to redirect
     * users back after successful authentication.
     */
    req.rememberLocation = function() {
      if (req.route.method == 'get' && !req.xhr) {
        var url = req.protocol + "://" + req.host + req.path;
        debug('rememberLocation(%s)', url);
        res.cookie("loc", url, { maxAge: 600000 });
      }
    };

    /**
     * Returns the URL previously saved with `req.rememberLocation`.
     *
     * Default location, which is returned in case `req.rememberLocation` was not
     * called before, is configured via `conf.auth.defaultLocation`.
     *
     * @returns {*|string} URL or default location
     */
    req.lastLocation = function() {
      return req.cookies.loc || conf.auth.defaultLocation || '/';
    };

    /**
     * Currently authenticated principal is populated
     * using specified function `conf.auth.findUserById(userId, cb)`
     */
    if (req.session.principalId) {
      debug('PrincipalId is ' + req.session.principalId);
      conf.auth.findUserById(req.session.principalId, function(err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('User not found.'));
        req.principal = res.locals.principal = user;
        return next();
      });
    } else next();

  };

};