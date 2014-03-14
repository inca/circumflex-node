'use strict';

var assert = require('assert');

var Conf = require('../lib/configuration');

function withEnv(env, cb) {
  for (var key in env) {
    process.env[key] = env[key];
  }
  cb();
  for (var key in env) {
    delete process.env[key];
  }
}

function withProduction(cb) {
  return withEnv({ NODE_ENV: 'production' }, cb);
}

describe('Configuration API', function() {

  it('should detect production environment', function() {
    assert.equal(new Conf().production, false);
    withProduction(function() {
      assert.equal(new Conf().production, true);
    });
  });

  it('should return default values with no options passed', function() {
    var conf = new Conf();
    assert.equal(conf.port, 8123);
  });

  it('should override default values with options', function() {
    var conf = new Conf({ port: 1234 });
    assert.equal(conf.port, 1234);
  });

  it('should override default values with env variables', function() {
    withEnv({ PORT: 4321 }, function() {
      var conf = new Conf({ port: 1234 });
      assert.equal(conf.port, 4321);
    });
  });

  it('should override properties via the development object', function() {
    var conf = new Conf({
      port: 1234,
      development: {
        port: 4321
      }
    });
    assert.equal(conf.port, 4321);
  });

  it('should ignore development object in production', function() {
    withProduction(function() {
      var conf = new Conf({
        port: 1234,
        development: {
          port: 4321
        }
      });
      assert.equal(conf.port, 1234);
    });
  });

  it('should compose origin from provided options', function() {
    // The defaults are `http://127.0.0.1`
    var conf = new Conf();
    assert.equal(conf.origin, 'http://127.0.0.1');
    // Overridden by `domain`
    conf = new Conf({ domain: 'myapp.com' });
    assert.equal(conf.origin, 'http://myapp.com');
    // Overridden by env variable
    withEnv({ DOMAIN: 'mydomain.com' }, function() {
      conf = new Conf({ domain: 'myapp.com' });
      assert.equal(conf.origin, 'http://mydomain.com');
    });
  });

  it('should compose static origin from provided options', function() {
    // The defaults are `//127.0.0.1`
    var conf = new Conf();
    assert.equal(conf.staticOrigin, '//127.0.0.1');
    // `domain` is used if `staticDomain` is not specified
    conf = new Conf({ domain: 'myapp.com'});
    assert.equal(conf.staticOrigin, '//myapp.com');
    // `staticDomain` overrides `domain`
    conf = new Conf({ domain: 'myapp.com', staticDomain: 'static.myapp' });
    assert.equal(conf.staticOrigin, '//static.myapp');
    // development conf overrides production
    conf = new Conf({
      domain: 'myapp.com',
      staticDomain: 'static.myapp',
      development: {
        staticDomain: 'static.myapp.dev'
      }
    });
    assert.equal(conf.staticOrigin, '//static.myapp.dev');
    // finally, env variable overrides 'em all
    withEnv({ 'STATIC_DOMAIN': 'static.domain' }, function() {
      conf = new Conf({
        domain: 'myapp.com',
        staticDomain: 'static.myapp',
        development: {
          staticDomain: 'static.myapp.dev'
        }
      });
      assert.equal(conf.staticOrigin, '//static.domain');
    });
  });

  it('should compose secure origin from provided options', function() {
    // The defaults are `https://127.0.0.1`
    var conf = new Conf();
    assert.equal(conf.secureOrigin, 'https://127.0.0.1');
    // `domain` is used if `secureDomain` is not specified
    conf = new Conf({ domain: 'myapp.com'});
    assert.equal(conf.secureOrigin, 'https://myapp.com');
    // `secureDomain` overrides `domain`
    conf = new Conf({ domain: 'myapp.com', secureDomain: 'secure.myapp' });
    assert.equal(conf.secureOrigin, 'https://secure.myapp');
    // development conf overrides production
    conf = new Conf({
      domain: 'myapp.com',
      secureDomain: 'secure.myapp',
      development: {
        secureDomain: 'secure.myapp.dev'
      }
    });
    assert.equal(conf.secureOrigin, 'https://secure.myapp.dev');
    // finally, env variable overrides 'em all
    withEnv({ 'SECURE_DOMAIN': 'secure.domain' }, function() {
      conf = new Conf({
        domain: 'myapp.com',
        secureDomain: 'secure.myapp',
        development: {
          secureDomain: 'secure.myapp.dev'
        }
      });
      assert.equal(conf.secureOrigin, 'https://secure.domain');
    });
  });

  it('should override key-wise values in development/production', function() {
    var conf = new Conf({
      port: {
        development: 2222,
        production: 3333
      }
    });
    assert.equal(conf.port, 2222);
    withProduction(function() {
      conf = new Conf({
        port: {
          development: 2222,
          production: 3333
        }
      });
      assert.equal(conf.port, 3333);
    });
  });

  it('should deflate nested objects', function() {
    var conf = new Conf({
      redis: {
        host: {
          development: 'redis.sandbox',
          production: 'redis.live'
        }
      }
    });
    assert.equal(conf.redis.host, 'redis.sandbox');
    withProduction(function() {
      var conf = new Conf({
        redis: {
          host: {
            development: 'redis.sandbox',
            production: 'redis.live'
          }
        }
      });
      assert.equal(conf.redis.host, 'redis.live');
    });
  });

  it('should leave arrays untouched', function() {
    var conf = new Conf({
       array: ['one', 'two', 'three']
    });
    assert.equal(Array.isArray(conf.array), true);
  });

});