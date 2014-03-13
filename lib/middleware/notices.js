'use strict';

var vsprintf = require("sprintf").vsprintf
  , _ = require('underscore');

/**
 * Allows constructing disposable messages which are meant to be shown only once.
 *
 * @param conf Circumflex configuration
 * @returns {Function} Middleware function
 */
module.exports = function(conf) {

  return function notices(req, res, next) {

    var notices = res.notices = res.locals.notices = {

      /**
       * Retrieves all notices and deletes them from the queue.
       *
       * @returns {Array} Notices array
       */
      purge: function() {
        var all = req.session.notices;
        if (!all)
          all = [];
        req.session.notices = null;
        return all;
      },

      add: function(kind, m) {
        var all = req.session.notices;
        if (!all)
          all = [];
        // Format message
        var message = m;
        var params = Array.prototype.slice.call(arguments, 2);
        if (req.i18n && req.i18n.__ && typeof req.i18n.__ == 'function') {
          message = req.i18n.__.apply(req.i18n, [m].concat(params));
        } else {
          message = vsprintf(m, params);
        }
        // Push to session
        all.push({
          kind: kind,
          msg: message
        });
        req.session.notices = all;
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
        if (req.xhr)
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
  }

};
