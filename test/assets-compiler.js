'use strict';

var assert = require('assert')
  , fs = require('fs')
  , compiler = require('../lib/assets-compiler');

var conf = require('./mock/conf');

describe('Assets compiler', function() {

  before(function(cb) {
    require('rimraf')('mock/public/generated', function(err) {
      if (err) return cb(err);
      compiler.compile(conf, cb);
    });
  });

  it('should compile Stylus files', function(cb) {
    fs.readFile(__dirname + '/mock/public/css/main.css', 'utf-8', function(err, text) {
      if (err) return cb(err);
      assert.equal(text, 'html,body{margin:0;padding:0}');
      cb();
    })
  });

  it('should collect scripts', function(cb) {
    fs.readFile(__dirname + '/mock/public/generated/global_e9e3a357.js',
      'utf-8', function(err, text) {
      if (err) return cb(err);
      assert.equal(text, 'var lib = {};\nconsole.log(\'Howdy\');\n');
      cb();
    })
  });

  it('should group stylesheets by media', function(cb) {
    fs.readFile(__dirname + '/mock/public/generated/global_70e0fd47.css',
      'utf-8', function(err, text) {
      if (err) return cb(err);
      assert.equal(text, 'html,body{margin:0;padding:0}\n');
      cb();
    })
  });

  it('should generate assets.json', function(cb) {
    fs.readFile(__dirname + '/mock/public/assets.json',
      'utf-8', function(err, text) {
      if (err) return cb(err);
      var assetsJson = JSON.parse(text);
      assert.equal(assetsJson.global.css.length, 2);
      assert.equal(assetsJson.global.js[0].src, '/generated/global_e9e3a357.js');
      cb();
    })
  });

});
