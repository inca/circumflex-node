'use strict';

var debug = require('debug')('circumflex:auth')
  , _ = require('underscore')
  , async = require('async');

/**
 * Simple session-based authentication middleware.
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  /**
   * Returns a random ASCII-compliant string of specified length.
   *
   * @param length
   */
  function randomString(length) {
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-=!@#$%^&*()_+|}{';
    var result = 0;
    for (var i = 0; i < length; i++)
      result += CHARS[Math.floor(Math.random() * CHARS.length)];
    return result;
  }

  /**
   * To allow "Remember me" the `conf.auth.persistence` object
   * must be provided with four methods:
   *
   *   * `saveToken: function(user, token, cb)`
   *   * `hasToken: function(user, token, cb)`
   *   * `dropToken: function(user, token, cb)`
   *   * `clearTokens: function(user, cb)`
   */
  var persistence = conf.auth.persistence;
  if (persistence) {
    // Check that all methods exist
    ['saveToken', 'hasToken', 'dropToken', 'clearTokens']
      .forEach(function(method) {
        if (typeof(persistence[method]) != 'function')
          throw new Error('conf.auth.persistence.' + method + ' is not a function');
      });
    // Configure default cookie
    persistence.cookie = _.extend({
      name: 'at',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      signed: true
    }, persistence.cookie);
  }

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
        req.session.authPrincipalId = id.toString();
      }
      cb();
    };

    /**
     * Stores a persistent cookie for "Remember me" authentication.
     *
     * @param user {*} User object
     * @param cb {Function} Callback
     */
    req.persistLogin = function(user, cb) {
      if (!persistence)
        throw new Error('Persistent auth requires additional configuration.');
      // Generate a token
      var token = randomString(32);
      // Store it
      persistence.saveToken(user, token, function(err) {
        if (err) return cb(err);
        // Keep track of it in current session
        req.session.authPersistenceToken = token;
        // Add a cookie
        var cookieName = persistence.cookie.name;
        var cookieValue = conf.auth.getUserId(user) + ':' + token;
        res.clearCookie(cookieName);
        res.cookie(cookieName, cookieValue, persistence.cookie);
        // Return this token
        cb(null, token);
      });
    };

    /**
     * Removes an association between current session and authenticated user.
     *
     * @param cb {Function} Callback
     */
    req.logout = function(cb) {
      // Only destroy the session if not persistent
      if (!persistence)
        return req.session.destroy(cb);
      // Drop persistence token and cookie
      res.clearCookie(persistence.cookie.name);
      if (req.principal && req.session.authPersistenceToken)
        persistence.dropToken(req.principal, req.session.authPersistenceToken,
          function(err) {
            if (err) return cb(err);
            req.session.destroy(cb);
          });
      else req.session.destroy(cb);
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
     * Attempts to populate the `req.principal` with currently logged
     * authentication identity.
     *
     * @param cb {Function} Callback
     */
    req.trySessionLogin = function(cb) {
      var userId = req.session.authPrincipalId;
      if (!userId)
        return cb();
      conf.auth.findUserById(userId, function(err, user) {
        if (err) return next(err);
        if (!user) {
          delete req.session.authPrincipalId;
          return next();
        }
        req.principal = res.locals.principal = user;
        return next();
      });
    };

    /**
     * Attempts to authenticate using a cookie which is supposed to
     * be previously set via `req.persistLogin`.
     *
     * @param cb {Function} Callback
     */
    req.tryPersistentLogin = function(cb) {
      // Ensure there is only one attempt per session
      if (req.session.authPersistentLoginAttempted)
        return cb();
      req.session.authPersistentLoginAttempted = true;
      // Read data from the cookie
      var cookieValue = req.signedCookies[persistence.cookie.name];
      if (!cookieValue) return cb();
      var userId = cookieValue.substring(0, cookieValue.indexOf(':'));
      var token = cookieValue.substring(cookieValue.indexOf(':') + 1);
      // Attempt to find a user
      conf.auth.findUserById(userId, function(err, user) {
        if (err) return cb(err);
        if (!user) return cb();
        // See if user really owns the token
        persistence.hasToken(user, token, function(err, owns) {
          if (err) return cb(err);
          if (!owns) return cb();
          // Log him in
          req.login(user, function(err) {
            if (err) return cb(err);
            // TODO add dropToken and persistLogin again
            // TODO once they fix sessions to be cookie-friendly
            req.trySessionLogin(cb);
          });
        });
      });
    };

    /**
     * Middleware body.
     */
    req.trySessionLogin(function(err) {
      if (err) return next(err);
      if (persistence)
        req.tryPersistentLogin(next);
      else next();
    });

  };

};