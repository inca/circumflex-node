#!/usr/bin/env node

'use strict';

var app = require('./app');

app.run(function() {
  console.log('Visit http://localhost:%s to begin.', app.conf.port);
});
