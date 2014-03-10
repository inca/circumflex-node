'use strict';

/**
 * A mixin with standard extensions for Express `request` prototype.
 */
var Request = module.exports = exports = {

  /**
   * Resolves an unmodified request parameter from following locations:
   *
   *   * `req.params`
   *   * `req.body`
   *   * `req.query`
   *
   *  It basically does the same as `req.param` method provided by Express,
   *  but also accepts optional `defaultValue`.
   *
   *  All parameter coercion methods delegate to `getParam` for resolving
   *  the initial value to work with.
   *
   * @mixin
   * @param name -- parameter name
   * @param defaultValue -- optional value to return if parameter not found
   *                        in specified locations
   */
  getParam: function(name, defaultValue) {
    var params = this.params || {};
    var body = this.body || {};
    var query = this.query || {};
    return (params.hasOwnProperty(name) && params[name])
      || body[name] || query[name] || defaultValue;
  },

  /**
   * Returns a single string parameter value for accessing form data from
   * text inputs, selects and hidden inputs.
   *
   * Comes in handy because:
   *
   *   * it guards against arrays (where you expect a parameter to occur once,
   *     but the client sends it twice and Express interprets it as an array)
   *
   *   * it returns an empty string, if no default value is provided -- this
   *     way you can use String methods (`trim`, `toLowerCase`, etc.) prior
   *     to validation without the risk of null pointer exceptions
   *
   * @param name
   * @param defaultValue
   */
  getString: function(name, defaultValue) {
    var value = this.getParam(name);
    return typeof(value) == 'string' ? value : defaultValue || '';
  },

  /**
   * Returns an array of strings, that is:
   *
   *   * an empty array if no parameter occurred,
   *   * a single-string array if a single parameter given,
   *   * a multi-string array in case... well, you get it :)
   *
   * Default value is left unmodified.
   *
   * @param name
   * @param defaultValue
   * @returns {Array} an array of strings
   */
  getStrings: function(name, defaultValue) {
    var value = this.getParam(name);
    if (typeof(value) == 'string') return [value];
    if (Array.isArray(value))
      return value.filter(function(v) {
        return typeof(v) == 'string';
      });
    return defaultValue || [];
  }

};
