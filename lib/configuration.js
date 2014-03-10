'use strict';

var _ = require('underscore');

/**
 * BigFoot configuration API.
 *
 * Most configuration parameters are provided with suitable defaults
 * and can be overridden via process environment variables and supplied `options`
 * (with environment variables taking precedence).
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
 *  @return resolved value or default value
 *  @api private
 *
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
 * Set `options.ssl` to `true` if application is behind a trusted proxy
 * (Nginx) which handles SSL certificates.
 *
 * This one is used in `origin` property globally and can be overridden
 * on request inside a middleware or a route.
 *
 * @type {boolean}
 */
Object.defineProperty(Configuration.prototype, 'ssl', {
  get: function() {
    return this.resolve('ssl', false);
  }
});

/**
 * Application protocol: 'http' or 'https', depending on `ssl` properties.
 */
Object.defineProperty(Configuration.prototype, 'protocol', {
  get: function() {
    return this.ssl ? 'https' : 'http';
  }
});

/**
 * Application origin (e.g. `https://mydomain.tld`) used to compose external
 * links to this application in contexts where `Host` request header
 * is not available (e. g. offline worker queues).
 *
 * Depends on `protocol` and `domain` properties.
 *
 * @type {string}
 * @return origin — a string composed of HTTP schema and main domain.
 */
Object.defineProperty(Configuration.prototype, 'origin', {
  get: function() {
    return this.protocol + '://' + this.domain;
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

