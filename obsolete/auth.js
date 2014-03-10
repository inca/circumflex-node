'use strict';

/**
 * Request authentication middleware.
 *
 * @param conf
 * @returns {Function}
 */
module.exports = function(conf) {

  var debug = require('debug')('bigfoot:auth');

  var User = conf.auth && conf.auth.model;

  if (!User) {
    console.error('Configure `conf.auth.model` to your mongoose User model.');
  } else {
    app.useMongo = true;
    // Ensure mongo conf
    if (!conf.mongo) {
      console.warn('Specify `conf.mongo` with Mongo connection settings.')
    }
  }

  return function(req, res, next) {

    if (!app.useMongo)
      return next();

    req.login = function(user, cb) {
      req.session.principalId = user.id.toString();
      if (typeof cb == "function")
        cb();
    };

    req.logout = function() {
      delete req.session.principalId;
    };

    req.rememberLocation = function() {
      if (req.route.method == 'get' && !req.xhr)
        res.cookie("loc", req.path, { maxAge: 600000 });
    };

    req.lastLocation = function() {
      return req.cookies.loc || '/';
    };

    // Finally, populate `req.principal`
    if (req.session.principalId) {
      debug('PrincipalId is ' + req.session.principalId);
      User.findOne({ _id: req.session.principalId })
        .exec(function(err, user) {
          if (err) return next(err);
          req.principal = res.locals.principal = user;
          return next();
        });
    } else next();

  }

};