'use strict';

var assert = require('assert')
  , http = require('http')
  , request = require('request');

var Application = require('../lib/application');

describe('Request extensions', function() {

  describe('getString', function() {

    var app = new Application();
    var server = http.createServer(app);

    before(function(cb) {
      server.listen(app.conf.port, cb);
    });

    after(function(cb) {
      server.close(cb);
    });

    app.get('/', function(req, res, next) {
      res.send(req.getString('foo', 'bar'));
    });

    app.get('/foo', function(req, res, next) {
      res.send(req.getString('foo'));
    });

    app.get('/foo/:foo', function(req, res, next) {
      res.send(req.getString('foo', 'bar'));
    });

    it('resolves named parameters', function(cb) {
      request.get('http://localhost:8123/foo/PREVED', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'PREVED');
        cb();
      });
    });

    it('returns default value', function(cb) {
      request.get('http://localhost:8123/', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'bar');
        cb();
      });
    });

    it('resolves a parameter from query string', function(cb) {
      request.get('http://localhost:8123/foo?foo=PREVED', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'PREVED');
        cb();
      });
    });

    it('returns an empty string when not provided', function(cb) {
      request.get('http://localhost:8123/foo', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '');
        cb();
      });
    });

  });

  describe('getStrings', function() {

    var app = new Application();
    var server = http.createServer(app);

    before(function(cb) {
      server.listen(app.conf.port, cb);
    });

    after(function(cb) {
      server.close(cb);
    });

    app.get('/', function(req, res, next) {
      res.send(req.getStrings('foo').join(', '));
    });

    it('resolves an array of strings', function(cb) {
      request.get('http://localhost:8123/?foo=one&foo=two', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'one, two');
        cb();
      });
    });

    it('returns a single-string array', function(cb) {
      request.get('http://localhost:8123/?foo=one', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'one');
        cb();
      });
    });

    it('returns an []', function(cb) {
      request.get('http://localhost:8123/', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '');
        cb();
      });
    });

  });

  describe('getInteger', function() {

    var app = new Application();
    var server = http.createServer(app);

    before(function(cb) {
      server.listen(app.conf.port, cb);
    });

    after(function(cb) {
      server.close(cb);
    });

    app.get('/', function(req, res, next) {
      res.send('foo=' + req.getInteger('foo', -1));
    });

    it('returns a parsed integer', function(cb) {
      request.get('http://localhost:8123/?foo=10', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'foo=10');
        cb();
      });
    });

    it('returns a default value if parameter unspecified', function(cb) {
      request.get('http://localhost:8123/', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, 'foo=-1');
        cb();
      });
    });

  });

  describe('getIntegers', function() {

    var app = new Application();
    var server = http.createServer(app);

    before(function(cb) {
      server.listen(app.conf.port, cb);
    });

    after(function(cb) {
      server.close(cb);
    });

    app.get('/', function(req, res, next) {
      res.send(
        req.getIntegers('foo')
          .map(function(n) { return n + 1 })
          .join(', '));
    });

    it('parses an array of integers', function(cb) {
      request.get('http://localhost:8123/?foo=10&foo=abc&foo=2', function(err, res, body) {
        if (err) return cb(err);
        assert.equal(body, '11, 3');
        cb();
      });
    });

  });

});