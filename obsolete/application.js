'use strict';

var debug = require('debug')('bigfoot:app')
  , http = require('http')
  , mongoose = require('mongoose')
  , _ = require('underscore');

module.exports = function(conf) {

  this.conf = conf;

  if (!conf.id) {
    console.warn('Please set `conf.id` with application identifier.')
  }

  if (!conf.port) {
    console.warn('Specify `conf.port`.');
  }

  if (!conf.schema) {
    console.warn('Specify `conf.schema` (default is http).');
    conf.schema = 'http';
  }

  if (!conf.domain) {
    console.warn('Specify `conf.domain`.');
  }

  this.origin = conf.schema + '://' + conf.domain;

  if (!conf.cdnDomain) {
    console.warn('Specify `conf.cdnDomain` for static serving.');
    conf.cdnDomain = conf.domain;
  }

  this.cdnOrigin = '//' + conf.cdnDomain;

  if (!conf.publicPath) {
    console.warn('Specify `conf.publicPath` to point to your static assets.');
  }

  if (!conf.viewsPath) {
    console.warn('Specify `conf.viewsPath` to point to your views.');
  }

  // Create an Express application

  this.express = require('express')();

  // Proxy all its functions

  for (var i in this.express) {
    var fn = this.express[i];
    if (typeof(fn) == 'function') {
      this[i] = fn.bind(this.express);
    }
  }

};

module.exports.prototype = {

  // Middleware management

  __middleware: function (name, fn) {
    return { route: '', name: name, handle: fn };
  },

  getMiddlewareIndex: function(thatName) {
    for (var i = 0; i < this.express.stack.length; i++) {
      var h = this.express.stack[i];
      if ((h.name || h.handle.name) == thatName)
        break;
    }
    return i;
  },

  installLast: function(name, fn) {
    debug('Installing “' + name + '” as the last one');
    this.express.stack.push(this.__middleware(name, fn));
    return this;
  },

  install: function(name, fn) {
    return this.installLast(name, fn);
  },

  installFirst: function(name, fn) {
    debug('Installing “' + name + '” as the first one');
    this.express.stack.unshift(this.__middleware(name, fn));
    return this;
  },

  installBefore: function(thatName, name, fn) {
    debug('Installing “' + name + '” before “' + thatName + '”');
    var i = this.getMiddlewareIndex(thatName);
    this.express.stack.splice(i, 0, this.__middleware(name, fn));
    return this;
  },

  installAfter: function(thatName, name, fn) {
    debug('Installing “' + name + '” after “' + thatName + '”');
    var i = this.getMiddlewareIndex(thatName);
    if (i == this.express.stack.length)
      this.installLast(name, fn);
    else
      this.express.stack.splice(i + 1, 0, this.__middleware(name, fn));
    return this;
  },

  replace: function(name, fn) {
    debug('Replacing “' + name + '”.');
    var i = this.getMiddlewareIndex(name);
    if (i == this.express.stack.length)
      console.warn('Replacing “' + name + '” failed. Try installing instead.');
    else
      this.express.stack.splice(i, 1, __.__middleware(name, fn));
    return this;
  },

  handlers: function() {
    return this.express.stack.map(function(m) {
      return m.name || '<anonymous>';
    });
  },

  // Add run stuff

  run: function(cb) {
    var app = this
      , conf = app.conf
      , express = this.express
      , server = this.server = http.createServer(express)
      , port = conf.port || process.ENV.port
      , appId = conf.id + '@' + port;

    // Graceful shutdown

    var shutdown = function() {
      if (express.shuttingDown)
        return;
      express.shuttingDown = true;
      console.log(appId + ': shutting down.');
      server.close(function() {
        mongoose.disconnect(function() {
          console.log(appId + ': exiting.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    server.listen(port, function() {
      console.log(appId + ': visit ' + app.origin + ' to begin your work.');
      if (app.useMongo)
        mongoose.connect(conf.mongo.url, function() {
          debug('Connected to Mongo @ ' + conf.mongo.url);
        });
      if (typeof(cb) == 'function')
        cb();
    });

    return this;
  }

};