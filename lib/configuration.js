'use strict';

var _ = require('underscore')
  , express = require('express');

/**
 * BigFoot configuration API.
 *
 * Most configuration parameters are provided with suitable defaults
 * and can be overridden via process environment variables and supplied `options`
 * (with environment variables taking precedence).
 *
 * Mandatory parameters are:
 *
 *   * `router` — main application router. Typically one would create a module
 *     named `router.js` which exports `express.Router()`.
 *
 * See {@link resolve} for more information on the properties resolving algorithm.
 *
 * @constructor
 */
var Configuration
  = module.exports
  = exports
  = function(options) {

  this.options = options || {};

  // Check the router property
  var router = this.options.router;
  if (!router || router.constructor != express.Router) {
    // TODO replace with standard router
  }

};

/**
 * Whether application is run in production environment.
 *
 * @type {boolean}
 */
Object.defineProperty(Configuration.prototype, 'production', {
  get: function() {
    return process.env.NODE_ENV == 'production';
  }
});

/**
 * A generic getter for configuration properties.
 *
 * Each property is being looked up in following order:
 *
 *   * environment variable, the name uppercased,
 *     dots replaced with underscores, camelcase style replaced
 *     to underscore delimited
 *
 *   * `options.development` (only for non-production environment)
 *
 *   * supplied `options` object, dots designate nested objects
 *
 *   * if the property is found on `options` and it is an object,
 *     it is expected to have two keys: `production` and `development`
 *     to distinguish between values
 *
 *
 *  @param name configuration property name
 *  @param defaultValue returned if property is not found in specified locations
 *  @returns {*} resolved value or default value
 *  @private
 */
Configuration.prototype.resolve = function(name, defaultValue) {
  var words = name.split('.')
    , value = null;
  // 1. Lookup environment variable
  value = process.env[words.join('_').replace(/([A-Z])/g, '_$1').toUpperCase()];
  if (value) return value;
  // 2. Lookup in `options.development`
  if (!this.production && this.options.development) {
    value = lookup(this.options.development, words);
    if (value) return value;
  }
  // 3. Lookup in `options`
  function lookup(obj, words) {
    return words.reduce(function(memo, word) {
      return memo ? memo[word] : memo;
    }, obj);
  }
  value = lookup(this.options, words);
  if (value) {
    // Try production/development
    if (value.production && this.production)
      return value.production;
    if (value.development && !this.production)
      return value.development;
    return value;
  }
  // 4. Nothing matched, return default value
  return defaultValue;
};

/**
 * HTTP port applications listens on.
 *
 * @type {number}
 */
Object.defineProperty(Configuration.prototype, 'port', {
  get: function() {
    return this.resolve('port', 8123);
  }
});

/**
 * Main application domain used by the `origin` property.
 *
 * Defaults to 127.0.0.1
 *
 * @type {string}
 */
Object.defineProperty(Configuration.prototype, 'domain', {
  get: function() {
    return this.resolve('domain', '127.0.0.1')
  }
});

/**
 * Application origin (e.g. `http://mydomain.tld`) used to compose external
 * links to this application in contexts where `Host` request header
 * is not available (e. g. offline worker queues).
 *
 * Depends on the `domain` property.
 *
 * @type {string}
 * @returns {string} origin — a string composed of HTTP schema and main domain.
 */
Object.defineProperty(Configuration.prototype, 'origin', {
  get: function() {
    return 'http://' + this.domain;
  }
});

/**
 * The domain used for serving static files.
 *
 * Defaults to `domain`. It is recommended to override it in order
 * to save on cookies.
 *
 * @type {string}
 */
Object.defineProperty(Configuration.prototype, 'staticDomain', {
  get: function() {
    return this.resolve('staticDomain', this.domain);
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
    return '//' + this.staticDomain;
  }
});

/**
 * The domain used for secure operations (authentication, profile mgmt, etc.).
 *
 * Defaults to `domain`.
 *
 * @type {string}
 */
Object.defineProperty(Configuration.prototype, 'secureDomain', {
  get: function() {
    return this.resolve('secureDomain', this.domain);
  }
});

/**
 * Secure origin prepends `https://` to `secureDomain`.
 *
 * @type {string}
 */
Object.defineProperty(Configuration.prototype, 'secureOrigin', {
  get: function() {
    return 'https://' + this.secureDomain;
  }
});

/**
 * Root directory of an application.
 *
 * All other directories: public, views, routes, etc. are expected to
 * be found in this directory.
 *
 * Defaults to `process.cwd()`.
 *
 * @returns {string} path to root directory
 */
Object.defineProperty(Configuration.prototype, 'root', {
  get: function() {
    return this.resolve('root', process.cwd());
  }
});

