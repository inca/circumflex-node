'use strict';

var express = require('express');

var router = module.exports = new express.Router();

/**
 * An example of the router mounted with `/users` prefix
 */
router.get('/', function(req, res) {
  res.send('Users list.');
});
