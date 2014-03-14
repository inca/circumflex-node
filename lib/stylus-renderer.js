'use strict';

/**
 * Stylus Renderer function.
 *
 * @param str
 * @param path
 * @returns {Renderer}
 */
module.exports = function(str, path) {
  return require('stylus')(str)
    .set('filename', path)
    .set('compress', true)
    .set('include css', true)
    .use(require('nib')())
    .import('nib');
};