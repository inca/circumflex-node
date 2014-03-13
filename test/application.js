'use strict';

var assert = require('assert')
  , http = require('http')
  , request = require('request');

var Application = require('../lib/application')
  , Configuration = require('../lib/configuration');

describe('Application API', function() {

  it('is a function', function() {
    assert.equal(typeof new Application(), 'function');
  });

  it('should accept configuration or plain options object', function() {
    assert.equal(new Application({ port: 1234 }).conf.port, 1234);
    assert.equal(new Application(new Configuration({ port: 1234 })).conf.port, 1234);
  });

  it('should extend Express application', function() {
    var app = new Application();
    var methods = ['use', 'handle', 'get', 'post', 'put', 'delete', 'all'];
    methods.forEach(function(method) {
      assert.equal(typeof app[method], 'function');
    });
  });

});

describe('Simple Circumflex application', function() {

  var app = require('./mock/app')
    , server = http.createServer(app);

  before(function(cb) {
    server.listen(app.conf.port, cb);
  });

  after(function(cb) {
    server.close(cb);
  });

  it('should respond to generic routes', function(cb) {
    request.get('http://localhost:8123/', function(err, res, body) {
      assert.equal(body, 'Hello World');
      cb();
    });
  });

  describe('getString', function() {

    it('resolves named parameters', function(cb) {
      request.get('http://localhost:8123/getString/Alice', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'Hello Alice');
        cb();
      });
    });

    it('returns default value', function(cb) {
      request.get('http://localhost:8123/getString', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'Hello World');
        cb();
      });
    });

    it('resolves a parameter from query string', function(cb) {
      request.get('http://localhost:8123/getString?name=Alice', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'Hello Alice');
        cb();
      });
    });

  });

  describe('getStrings', function() {

    it('resolves an array of strings', function(cb) {
      request.get('http://localhost:8123/getStrings?foo=one&foo=two', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'one, two');
        cb();
      });
    });

    it('returns a single-string array', function(cb) {
      request.get('http://localhost:8123/getStrings?foo=one', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'one');
        cb();
      });
    });

    it('returns an []', function(cb) {
      request.get('http://localhost:8123/getStrings', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '');
        cb();
      });
    });

  });

  describe('getInteger', function() {

    it('returns a parsed integer', function(cb) {
      request.get('http://localhost:8123/getInteger?foo=3.14', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'foo=3');
        cb();
      });
    });

    it('returns a default value if parameter unspecified', function(cb) {
      request.get('http://localhost:8123/getInteger', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'foo=-1');
        cb();
      });
    });

  });

  describe('getIntegers', function() {

    it('parses an array of integers', function(cb) {
      request.get('http://localhost:8123/getIntegers?foo=10&foo=abc&foo=2', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '11, 3');
        cb();
      });
    });

  });

  describe('getNumber', function() {

    it('returns a parsed number', function(cb) {
      request.get('http://localhost:8123/getNumber?foo=3.14', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'foo=3.14');
        cb();
      });
    });

    it('returns a default value if parameter unspecified', function(cb) {
      request.get('http://localhost:8123/getNumber', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'foo=-1');
        cb();
      });
    });

  });

  describe('getNumbers', function() {

    it('parses an array of numbers', function(cb) {
      request.get('http://localhost:8123/getNumbers?foo=10.3&foo=abc&foo=2.3',
        function(err, res, body) {
          if (err) return cb(err);
          assert.equal(body, '11.3, 3.3');
          cb();
        });
    });

  });

  describe('getMoment', function() {

    it('parses a Moment date', function(cb) {
      request.get('http://localhost:8123/getMoment?foo=1988-01-29', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '29');
        cb();
      });
    });

    it('falls back to default value', function(cb) {
      request.get('http://localhost:8123/getMoment?foo=abc', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '256');
        cb();
      });
    });

  });

  describe('getMoments', function() {

    it('parses an array of Moment dates', function(cb) {
      request.get('http://localhost:8123/getMoments?foo=1988-01-29&foo=1988-09-05',
        function(err, res, body) {
          if (err) return cb(err);
          assert.equal(body, '29.01.88 05.09.88');
          cb();
        });
    });

  });

});