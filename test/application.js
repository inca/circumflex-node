'use strict';

var assert = require('assert');

var Application = require('../lib/application')
  , Configuration = require('../lib/configuration');

describe('Application API', function() {

  it('is a function', function() {
    assert.equal(typeof new Application(), 'function');
  });

  it('should accept configuration or plain options object', function() {
    var conf = new Configuration({ port: 1234 });
    assert.equal(new Application({ port: 1234 }).conf.port, 1234);
    assert.equal(new Application(conf).conf.port, 1234);
  });

  it('should extend Express application', function() {
    var app = new Application();
    var methods = ['use', 'handle', 'get', 'post', 'put', 'delete', 'all'];
    methods.forEach(function(method) {
      assert.equal(typeof app[method], 'function');
    });
  });

});