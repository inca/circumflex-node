'use strict';

var _ = require('underscore')
  , express = require('express');

var Configuration = require('./configuration')
  , RequestExt = require('./request-ext');

/**
 * A constructor for minimalistic Circumflex application.
 *
 * @constructor
 */
var Application
  = module.exports
  = exports
  = function(conf) {

  // 1. Attach configuration
  this.conf = conf || new Configuration();
  if (this.conf.constructor != Configuration)
    this.conf = new Configuration(this.conf);

  // 2. Clone express onto this application
  _.extend(this, express());

  // 3. Extend request and response prototypes
  _.extend(express.request, RequestExt)

};