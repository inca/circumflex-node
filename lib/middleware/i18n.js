'use strict';

var I18n2 = require("i18n-2");

/**
 * I18N middleware backed by John Resig's `i18n-2` module.
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  return function i18n(req, res, next) {
    req.i18n = new I18n2({
      locales: conf.locales || ['en'],
      extension: '.json'
    });
    I18n2.registerMethods(res.locals, req);
    next();
  }

};
