'use strict';

module.exports = {

  Application: require('./application'),

  AssetsCompiler: require('./assets-compiler'),

  middleware: {
    logger: require('morgan'),
    cookieParser: require('cookie-parser'),
    session: require('circumflex-session'),
    i18n: require('./middleware/i18n'),
    notices: require('./middleware/notices'),
    assets: require('./middleware/assets'),
    stylus: require('stylus').middleware,
    static: require('express').static,
    errorHandler: require('errorhandler')
  }

};
