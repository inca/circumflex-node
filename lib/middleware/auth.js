'use strict';

module.exports = function(conf) {

  // TODO implement configurable auth middleware
  return function(req, res, next) {
    next();
  };

};