'use strict';

var fs = require('fs')
  , async = require('async')
  , $ = require('./app').main;

$.get('/', function(req, res) {
  res.send('Hello World');
});

$.get('/getString', function(req, res) {
  res.send('Hello ' + req.getString('name', 'World'));
});

$.get('/getString/:name', function(req, res) {
  res.send('Hello ' + req.getString('name'));
});

$.get('/getStrings', function(req, res, next) {
  res.send(req.getStrings('foo').join(', '));
});

$.get('/getInteger', function(req, res, next) {
  res.send('foo=' + req.getInteger('foo', -1));
});

$.get('/getIntegers', function(req, res, next) {
  res.send(req.getIntegers('foo').map(function(num) { return num + 1 }).join(', '));
});

$.get('/getNumber', function(req, res, next) {
  res.send('foo=' + req.getNumber('foo', -1));
});

$.get('/getNumbers', function(req, res, next) {
  res.send(req.getNumbers('foo').map(function(num) { return num + 1 }).join(', '));
});

$.get('/getMoment', function(req, res, next) {
  var m = req.getMoment('foo', '2014-09-13');
  res.send(m.dayOfYear().toString());
});

$.get('/getMoments', function(req, res, next) {
  var dates = req.getMoments('foo', '2014-09-12');
  res.send(dates.map(function(m) {
    return m.format('DD.MM.YY');
  }).join(' '));
});

$.post('/getFile', function(req, res, next) {
  var file = req.getFile('file');
  fs.readFile(file.path, function(err, text) {
    if (err) return next(err);
    res.send(file.safeName + ': ' + text);
  });
});

$.post('/getFiles', function(req, res, next) {
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

$.get('/getPath/*', function(req, res, next) {
  res.send(req.getPath(0));
});

$.get('/emitCss', function(req, res, next) {
  res.send(res.locals.emitCss('global'));
});

$.get('/emitJs', function(req, res, next) {
  res.send(res.locals.emitJs('global'));
});

$.get('/protected', function(req, res, next) {
  if (!req.principal) {
    req.rememberLocation();
    res.redirect('/login');
  } else res.send('Hi, ' + req.principal.name);
});

$.get('/login', function(req, res, next) {
  res.send('Authenticate, please.');
});

$.post('/login', function(req, res, next) {
  req.conf.auth.findUserById(req.getString('user'), function(err, user) {
    if (err) return next(err);
    req.login(user, function(err) {
      if (err) return next(err);
      res.redirect(req.lastLocation());
    });
  });
});

