'use strict';

module.exports = {

  Application: require('./application'),

  middleware: {
    logger: require('morgan'),
    cookieParser: require('cookie-parser'),
    session: require('circumflex-session'),
    i18n: require('./middleware/i18n'),
    notices: require('./middleware/notices'),
    stylus: require('stylus').middleware,
    static: require('express').static,
    errorHandler: require('errorhandler')
  }

};
