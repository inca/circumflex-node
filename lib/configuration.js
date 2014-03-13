'use strict';

var _ = require('underscore')
  , express = require('express')
  , path = require('path');

/**
 * Circumflex Configuration API.
 *
 * Most configuration parameters are provided with suitable defaults
 * and can be overridden via process environment variables and supplied `options`
 * (with environment variables taking precedence).
 *
 * Configuration provides a handy technique called _deflating_: a property
 * can be an object with two keys: `development` and `production`. Actual value
 * is picked depending on `NODE_ENV=production` environment variable.
 *
 * Mandatory parameters are:
 *
 *   * `router` — main application router. Typically one would create a module
 *     named `router.js` which exports `express.Router()`.
 *
 * See {@link add} for more information on environment variable overrides and deflating.
 *
 * @constructor
 */
var Configuration
  = module.exports
  = exports
  = function(options) {

  /**
   * Default options are used if `options` not specified.
   */
  options = _.extend({
    port: 8123,
    domain: '127.0.0.1',
    root: process.cwd()
    // TODO add default router
  }, options);

  /**
   * Whether application is run in production environment.
   *
   * @type {boolean}
   */
  this.production = process.env.NODE_ENV == 'production';

  /**
   * Properties are copied from `options.development`
   * in non-production environment.
   */
  if (!this.production && options.development) {
    _.extend(options, options.development);
  }

  /**
   * Properties are copied from `options.production`
   * in production environment.
   */
  if (this.production && options.production) {
    _.extend(options, options.production);
  }

  /**
   * The `development` and `production` objects are stripped from `options`.
   */
  delete options.development;
  delete options.production;

  /**
   * Add all options to this configuration.
   */
  for (var key in options)
    if (options.hasOwnProperty(key))
      this.add(key, options[key], true);

};

/**
 * Adds a configuration object, deflating properties recursively,
 * optionally looking for overrides specified in process environment variables.
 *
 * By properties deflating we assume a process of converting an object
 * with `production` and `development` keys into a single value, depending
 * on application environment.
 *
 * For example, assume the following object is added:
 *
 * ```
 * conf.add('prop', {
 *   production: 1,
 *   development 2
 * });
 * ```
 *
 * This results in adding a property `prop` with value `1` in production environment
 * and `2` in non-production (aka development) environment.
 *
 * @param key {string} Property key, can contain dots to indicate object nesting
 *
 * @param value {*} Property value to be added/deflated. If object is given,
 *   its keys are added recursively.
 *
 * @param useEnv {Boolean} Whether to look for the property value in
 *   `process.env`. The key is uppercased, camelcase delimiters and dots
 *   are converted to underscores.
 *
 */
Configuration.prototype.add = function(key, value, useEnv) {
  // 1. Lookup environment variable
  if (useEnv) {
    var envKey = key.replace(/([A-Z])/g, '_$1').replace(/\./g, '_').toUpperCase();
    var envVal = process.env[envKey];
    if (envVal)
      return this.set(key, envVal);
  }
  // 2. Guard against null and undefines
  if (value === null || value === undefined)
    return this.remove(key);
  // 3. Process objects
  if (typeof(value) == 'object') {
    var keys = Object.keys(value);
    // Look for deflatable objects
    if (keys.sort().join(' ') == 'development production')
      return this.add(
        key,
        this.production ? value.production : value.development,
        useEnv);
    // Process keys recursively
    for (var k in value)
      if (value.hasOwnProperty(k))
        this.add(key + '.' + k, value[k], useEnv);
  } else {
    // 4. Everything else
    this.set(key, value);
  }
};

/**
 * Sets configuration property, dots designate object nesting.
 * Does not modify values in any way.
 *
 * @param key {String} Property key
 * @param value {*} Property value
 */
Configuration.prototype.set = function(key, value) {
  if (typeof(key) != 'string')
    throw new Error('key must be a string');
  key = key.trim();
  if (key == '')
    throw new Error('key must be a non-empty string');
  var words = key.split('.');
  var parentObj = words.slice(0, words.length - 1).reduce(function(memo, word) {
    return memo[word] = memo[word] || {};
  }, this);
  parentObj[words[words.length - 1]] = value;
};

/**
 * Removes a configuration property. Dots designate object nesting.
 *
 * @param key {String} Property key
 */
Configuration.prototype.remove = function(key) {
  if (typeof(key) != 'string')
    throw new Error('key must be a string');
  key = key.trim();
  if (key == '')
    throw new Error('key must be a non-empty string');
  var words = key.split('.');
  var parentObj = words.slice(0, words.length - 1).reduce(function(memo, word) {
    return memo[word] = memo[word] || {};
  }, this);
  delete parentObj[words[words.length - 1]];
};

/**
 * Application origin (e.g. `http://mydomain.tld`) used to compose external
 * links to this application in contexts where `Host` request header
 * is not available (e. g. offline worker queues).
 *
 * Depends on the `domain` property.
 *
 * @type {string}
 * @returns {string} origin — a string composed of HTTP schema and main domain
 */
Object.defineProperty(Configuration.prototype, 'origin', {
  get: function() {
    return 'http://' + this.domain;
  }
});

/**
 * Static origin prepends `//` to `staticDomain`. It is used to render links
 * to static resources in production.
 *
 * @type {string}
 */
Object.defineProperty(Configuration.prototype, 'staticOrigin', {
  get: function() {
    return '//' + (this.staticDomain || this.domain);
  }
});

/**
 * Secure origin prepends `https://` to `secureDomain`. It is used for composing
 * links to sensitive application areas (authentication, profile mgmt, etc.)
 *
 * @type {string}
 */
Object.defineProperty(Configuration.prototype, 'secureOrigin', {
  get: function() {
    return 'https://' + (this.secureDomain || this.domain);
  }
});

/**
 * Returns a directory path relative to `root`.
 */
Configuration.prototype.dir = function(name) {
  return path.join(this.root, name);
};
