'use strict';

var flatMap = require('flatmap')
  , moment = require('moment');

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
   * It basically does the same as `req.param` method provided by Express,
   * but also accepts optional `defaultValue`.
   *
   * All parameter coercion methods delegate to `getParam` for resolving
   * the initial value to work with.
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
   * Resolves a single string parameter value for accessing form data from
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
   * Resolves an array of strings, that is:
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
    var value = this.getParam(name) || defaultValue;
    if (typeof(value) == 'string') return [value];
    if (Array.isArray(value))
      return value.filter(function(v) {
        return typeof(v) == 'string';
      });
    return [];
  },

  /**
   * Resolves an integer request parameter.
   *
   * Uses `parseInt` for parsing.
   *
   * @param name
   * @param defaultValue
   * @returns {number} resolved integer
   */
  getInteger: function(name, defaultValue) {
    var value = parseInt(this.getParam(name));
    return isNaN(value) ? parseInt(defaultValue) || 0 : value;
  },

  /**
   * Resolves an array of integers, filtering non-integer parameters,
   * using `parseInt` to parse them.
   *
   * @param name
   * @param defaultValue
   * @returns {Array} resolved array of integers
   */
  getIntegers: function(name, defaultValue) {
    var value = this.getParam(name) || defaultValue;
    if (Array.isArray(value))
      return flatMap(value, function(v) {
        var num = parseInt(v);
        return isNaN(num) ? null : num;
      });
    var num = parseInt(value);
    return isNaN(num) ? [] : [num];
  },

  /**
   * Resolves a number request parameter, using `parseFloat` to parse them.
   *
   * @param name
   * @param defaultValue
   * @returns {number} resolved number
   */
  getNumber: function(name, defaultValue) {
    var value = parseFloat(this.getParam(name));
    return isNaN(value) ? defaultValue || 0 : value;
  },

  /**
   * Resolves an array of numbers, filtering non-number parameters.
   *
   * Uses `parseFloat` to parse numbers.
   *
   * @param name
   * @param defaultValue
   * @returns {Array} resolved array of numbers
   */
  getNumbers: function(name, defaultValue) {
    var value = this.getParam(name) || defaultValue;
    if (Array.isArray(value))
      return flatMap(value, function(v) {
        var num = parseFloat(v);
        return isNaN(num) ? null : num;
      });
    var num = parseFloat(value);
    return isNaN(num) ? [] : [num];
  },

  /**
   * Resolves a {Moment} date by parsing a string request parameter
   * in `YYYY-MM-DD` format.
   *
   * If default value is omitted, moment of current date is returned.
   *
   * @param name
   * @param defaultValue
   * @returns {Moment}
   */
  getMoment: function(name, defaultValue) {
    var d = moment(this.getString(name), 'YYYY-MM-DD');
    return d.isValid() ? d : moment(defaultValue, 'YYYY-MM-DD');
  },

  /**
   * Resolves an array of {Moment} dates, filtering invalid dates.
   *
   * @param name
   * @param defaultValue
   * @returns {Array}
   */
  getMoments: function(name, defaultValue) {
    var value = this.getParam(name) || defaultValue;
    if (Array.isArray(value))
      return flatMap(value, function(v) {
        var mom = moment(v, 'YYYY-MM-DD');
        return mom.isValid() ? mom : null;
      });
    var mom = moment(value, 'YYYY-MM-DD');
    return mom.isValid() ? [mom] : [];
  },

  /**
   * Resolves a {Date} date by parsing a string request parameter
   * in `YYYY-MM-DD` format.
   *
   * If parsing fails and default value is omitted, returns `undefined`.
   *
   * @param name
   * @param defaultValue
   * @returns {Date}
   */
  getDate: function(name, defaultValue) {
    var value = this.getString(name);
    if (!value) return defaultValue;
    var mom = moment(value, 'YYYY-MM-DD');
    return mom.isValid() ? mom.toDate() : defaultValue || null;
  },

  /**
   * Resolves an array of {Date}, filtering invalid dates.
   *
   * @param name
   * @param defaultValue
   * @returns {Array}
   */
  getDates: function(name, defaultValue) {
    var value = this.getParam(name) || defaultValue || null;
    if (Array.isArray(value))
      return flatMap(value, function(v) {
        var mom = moment(v, 'YYYY-MM-DD');
        return mom.isValid() ? mom.toDate() : null;
      });
    var mom = moment(value, 'YYYY-MM-DD');
    return mom.isValid() ? [mom.toDate()] : [];
  },

  /**
   * Returns a single file from `input(type='file')` parsed with `multiparty`.
   *
   * @param name
   * @returns {Object} a file descriptor
   */
  getFile: function(name) {
    var files = this.files || {};
    var file = files[name];
    return file && file[0];
  },

  /**
   * Returns an array of files from `input(type='file' multiple='true')`
   * parsed with `multiparty`.
   *
   * @param name
   * @returns {Array} an array of file descriptors
   */
  getFiles: function(name) {
    var files = this.files || {};
    return files[name] || [];
  }

};
