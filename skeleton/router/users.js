'use strict';

var router = module.exports = require('express').Router();

/**
 * An example of the router mounted with `/users` prefix
 */
router.get('/', function(req, res) {
  res.send('Users list.');
});
