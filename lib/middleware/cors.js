'use strict';

/**
 * Attaches CORS headers if `Origin` request header is specified
 * and matches one of the origins specified in `conf.allowedOrigins`.
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  var origins = Array.isArray(conf.allowedOrigins) ?
    conf.allowedOrigins : null;

  return function cors(req, res, next) {
    var origin = req.get('Origin');
    if (origin) {
      var allowed = !origins || origins.indexOf(origin) > -1;
      if (allowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
      } else res.send(403);
    } else next();
  };

};