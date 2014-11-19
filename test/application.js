'use strict';

var assert = require('assert')
  , http = require('http')
  , request = require('request');

var Application = require('../lib/application')
  , Configuration = require('circumflex-configuration');

describe('Application API', function() {

  it('is a function', function() {
    assert.equal(typeof new Application({ silent: true }), 'function');
  });

  it('should accept configuration or plain options object', function() {
    assert.equal(new Application({ port: 1234, silent: true }).conf.port, 1234);
    assert.equal(new Application(new Configuration({ port: 1234, silent: true })).conf.port, 1234);
  });

  it('should extend Express application', function() {
    var app = new Application({ silent: true });
    var methods = ['use', 'handle', 'get', 'post', 'put', 'delete', 'all'];
    methods.forEach(function(method) {
      assert.equal(typeof app[method], 'function');
    });
  });

});

describe('Simple Circumflex application', function() {

  var app = require('./mock/app');

  before(function(cb) {
    app.run(cb);
  });

  it('should respond to generic routes', function(cb) {
    request.get('http://localhost:8123/', function(err, res, body) {
      assert.equal(body, 'Hello World');
      cb();
    });
  });

  describe('emitCss', function() {

    it('renders markup in development', function(cb) {
      request.get('http://localhost:8123/emitCss',
        function(err, res, body) {
          if (err) return cb(err);
          assert.equal(body,
            '<link rel="stylesheet" href="/css/main.css" media="screen, projection"/>' +
              '<link rel="stylesheet" href="/css/print.css" media="print"/>');
          cb();
        });
    });

  });

  describe('emitJs', function() {

    it('renders markup in development', function(cb) {
      request.get('http://localhost:8123/emitJs',
        function(err, res, body) {
          if (err) return cb(err);
          assert.equal(body,
            '<script type="text/javascript" src="/js/lib.js"></script>' +
              '<script type="text/javascript" src="/js/app.js"></script>');
          cb();
        });
    });

  });

});
