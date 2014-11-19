'use strict';

var fs = require('fs')
  , async = require('async')
  , $ = require('./app').main;

$.get('/', function(req, res) {
  res.send('Hello World');
});

$.get('/emitCss', function(req, res, next) {
  res.send(res.locals.emitCss('global'));
});

$.get('/emitJs', function(req, res, next) {
  res.send(res.locals.emitJs('global'));
});

