'use strict';

var assert = require('assert')
  , http = require('http')
  , request = require('request');

var Application = require('../lib/application');

describe('Request extensions', function() {

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

  describe('getString', function() {

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

});