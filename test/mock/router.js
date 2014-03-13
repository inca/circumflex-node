'use strict';

var express = require('express');

var router = module.exports = new express.Router();

router.get('/', function(req, res) {
  res.send('Hello World');
});

// req.getString

router.get('/getString', function(req, res) {
  res.send('Hello ' + req.getString('name', 'World'));
});

router.get('/getString/:name', function(req, res) {
  res.send('Hello ' + req.getString('name'));
});

// req.getStrings

router.get('/getStrings', function(req, res, next) {
  res.send(req.getStrings('foo').join(', '));
});

// req.getInteger

router.get('/getInteger', function(req, res, next) {
  res.send('foo=' + req.getInteger('foo', -1));
});

// req.getIntegers

router.get('/getIntegers', function(req, res, next) {
  res.send(req.getIntegers('foo').map(function(num) { return num + 1 }).join(', '));
});

// req.getNumber

router.get('/getNumber', function(req, res, next) {
  res.send('foo=' + req.getNumber('foo', -1));
});

// req.getNumbers

router.get('/getNumbers', function(req, res, next) {
  res.send(req.getNumbers('foo').map(function(num) { return num + 1 }).join(', '));
});

// req.getMoment

router.get('/getMoment', function(req, res, next) {
  var m = req.getMoment('foo', '2014-09-13');
  res.send(m.dayOfYear().toString());
});

// req.getMoments

router.get('/getMoments', function(req, res, next) {
  var dates = req.getMoments('foo', '2014-09-12');
  res.send(dates.map(function(m) {
    return m.format('DD.MM.YY');
  }).join(' '));
});
