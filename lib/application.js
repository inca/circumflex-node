'use strict';

var _ = require('underscore')
  , express = require('express');

var Configuration = require('./configuration')
  , RequestExt = require('./request-ext');

/**
 * A constructor for minimalistic Circumflex application.
 *
 * @param conf — Circumflex Configuration or its `options` object
 * @returns {Application} an application instance
 */
var Application
  = module.exports
  = exports
  = function(conf) {

  // 1. Create an express application
  var app = express();

  // 2. Attach configuration onto it
  app.conf = conf = conf || new Configuration();
  if (conf.constructor != Configuration)
    this.conf = new Configuration(conf);

  // 3. Extend request and response prototypes
  _.extend(express.request, RequestExt);

  return app;

};