'use strict';

var express = require('express');

var router = module.exports = new express.Router();

/**
 * Main application router typically includes more specific ones.
 */
router.get('/', function(req, res) {
  res.send('Hello world!');
});

router.use('/users', require('./users'));

