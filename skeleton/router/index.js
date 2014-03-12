'use strict';

var router = module.exports = require('express').Router();

/**
 * Main application router typically includes more specific ones.
 */
router.get('/', function(req, res) {
  res.send('Hello world!');
});

router.use('/users', require('./users'));

