'use strict';

var express = require('express')
  , fs = require('fs')
  , async = require('async');

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

// req.getFile

router.post('/getFile', function(req, res, next) {
  var file = req.getFile('file');
  fs.readFile(file.path, function(err, text) {
    if (err) return next(err);
    res.send(file.safeName + ': ' + text);
  });
});

// req.getFiles

router.post('/getFiles', function(req, res, next) {
  var files = req.getFiles('files');
  async.map(files, function(file, cb) {
    fs.readFile(file.path, function(err, text) {
      if (err) return cb(err);
      cb(null, file.safeName + ': ' + text);
    });
  }, function(err, results) {
    if (err) return next(err);
    res.send(results.join('\n'));
  });
});

