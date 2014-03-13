'use strict';

module.exports = function(conf) {

  // TODO implement configurable auth middleware
  return function auth(req, res, next) {
    next();
  };

};