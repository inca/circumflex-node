'use strict';

exports = {

  Application: require('./application'),

  Configuration: require('./configuration'),

  AssetsCompiler: require('./assets-compiler'),

  RequestExt: require('./request-ext'),

  middleware: {
    logger: require('morgan'),
    cors: require('./middleware/cors'),
    bodyParser: require('body-parser'),
    methodOverride: require('method-override'),
    multipart: require('./middleware/multipart'),
    cookieParser: require('cookie-parser'),
    session: require('./middleware/session'),
    auth: require('./middleware/auth'),
    i18n: require('./middleware/i18n'),
    notices: require('./middleware/notices'),
    assets: require('./middleware/assets'),
    stylus: require('stylus').middleware,
    static: require('express').static,
    errorHandler: require('errorhandler')
  }

};