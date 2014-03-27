'use strict';

var $ = require('../app').main;

$.get('/', function(req, res) {
  res.render('index');
});

// TODO add more routers
