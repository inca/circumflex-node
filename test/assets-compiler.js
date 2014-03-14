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

});
