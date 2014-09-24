'use strict';

var vsprintf = require("sprintf").vsprintf
  , _ = require('underscore');

/**
 * Allows constructing disposable messages which are meant to be shown only once.
 *
 * This middleware should be placed between session and router.
 * To store notices between requests the `StoreNotices` must also be
 * added after the router.
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = exports = function(conf) {

  return function notices(req, res, next) {

    if (!req.session)
      return next();

    res.on('finish', function() {
      if (res.notices)
        req.session.set('notices', res.notices.queue);
    });

    req.session.get('notices', function(err, _savedNotices) {
      if (err) return next(err);

      var notices = res.notices = res.locals.notices = {

        queue: _savedNotices || [],

        /**
         * Retrieves all notices and deletes them from the queue.
         *
         * @returns {Array} Notices array
         */
        purge: function() {
          var result = [].concat(this.queue);
          this.queue = [];
          if (result.length)
            req.session.remove('notices');
          return result;
        },

        add: function(kind, m) {
          // Format message
          var message = m;
          var params = Array.prototype.slice.call(arguments, 2);
          if (req.i18n && req.i18n.__ && typeof req.i18n.__ == 'function') {
            message = req.i18n.__.apply(req.i18n, [m].concat(params));
          } else {
            message = vsprintf(m, params);
          }
          // Push to session
          this.queue.push({
            kind: kind,
            msg: message
          });
          return this;
        },

        add_argv: function(kind, argv) {
          return this.add.apply(this, [kind].concat(Array.prototype.slice.call(argv)));
        },

        info: function() {
          return this.add_argv('info', arguments);
        },

        warn: function() {
          return this.add_argv('warn', arguments);
        },

        error: function() {
          return this.add_argv('error', arguments);
        },

        send: function() {
          res.json({ notices: notices.purge() });
          return notices;
        },

        redirect: function(url) {
          if (req.accepts('json'))
            res.json({
              notices: notices.purge(),
              redirect: url
            });
          else res.redirect(url);
          return notices;
        }

      };

      // Allow extending through conf

      _.extend(notices, conf.notices);

      next();


    });

  };
};
