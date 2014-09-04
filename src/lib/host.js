/**
 * Class to wrap URLS, formatting them and maintaining their separate details
 * @type {[type]}
 */
module.exports = Host;

var url = require('url');
var qs = require('querystring');
var _ = require('./utils');

var startsWithProtocolRE = /^([a-z]+:)?\/\//;

var urlParseFields = [
  'protocol', 'hostname', 'pathname', 'port', 'auth', 'query'
];

var simplify = ['host', 'path'];

// simple reference used when formatting as a url
// and defines when parsing from a string
Host.defaultPorts = {
  http: 80,
  https: 443
};

function Host(config) {
  config = config || {};

  // defaults
  this.protocol = 'http';
  this.host = 'localhost';
  this.path = '';
  this.port = 9200;
  this.auth = null;
  this.query = null;
  this.headers = null;
  this.suggestCompression = false;

  if (typeof config === 'string') {
    if (!startsWithProtocolRE.test(config)) {
      config = 'http://' + config;
    }
    config = _.pick(url.parse(config, false, true), urlParseFields);
    // default logic for the port is to use 9200 for the default. When a string is specified though,
    // we will use the default from the protocol of the string.
    if (!config.port) {
      var proto = config.protocol || 'http';
      if (proto.charAt(proto.length - 1) === ':') {
        proto = proto.substring(0, proto.length - 1);
      }
      if (Host.defaultPorts[proto]) {
        config.port = Host.defaultPorts[proto];
      }
    }
  }

  if (_.isObject(config)) {
    // move hostname/portname to host/port semi-intelligently.
    _.each(simplify, function (to) {
      var from = to + 'name';
      if (config[from] && config[to]) {
        if (config[to].indexOf(config[from]) === 0) {
          config[to] = config[from];
        }
      } else if (config[from]) {
        config[to] = config[from];
      }
      delete config[from];
    });
  } else {
    config = {};
  }

  _.assign(this, config);

  // make sure the query string is parsed
  if (this.query === null) {
    // majority case
    this.query = {};
  } else if (!_.isPlainObject(this.query)) {
    this.query = qs.parse(this.query);
  }

  // make sure that the port is a number
  if (_.isNumeric(this.port)) {
    this.port = parseInt(this.port, 10);
  } else {
    this.port = 9200;
  }

  // make sure the path starts with a leading slash
  if (this.path === '/') {
    this.path = '';
  } else if (this.path && this.path.charAt(0) !== '/') {
    this.path = '/' + (this.path || '');
  }

  // strip trailing ':' on the protocol (when config comes from url.parse)
  if (this.protocol.substr(-1) === ':') {
    this.protocol = this.protocol.substring(0, this.protocol.length - 1);
  }
}

Host.prototype.makeUrl = function (params) {
  params = params || {};
  // build the port
  var port = '';
  if (this.port !== Host.defaultPorts[this.protocol]) {
    // add an actual port
    port = ':' + this.port;
  }

  // build the path
  var path = '' + (this.path || '') + (params.path || '');

  // if path doesn't start with '/' add it.
  if (path.charAt(0) !== '/') {
    path = '/' + path;
  }

  // build the query string
  var query = qs.stringify(this.getQuery(params.query));

  var auth = '';
  if (params.auth) {
    auth = params.auth + '@';
  } else if (this.auth) {
    auth = this.auth + '@';
  }

  if (this.host) {
    return this.protocol + '://' + auth + this.host + port + path + (query ? '?' + query : '');
  } else {
    return path + (query ? '?' + query : '');
  }
};

function objectPropertyGetter(prop, preOverride) {
  return function (overrides) {
    if (preOverride) {
      overrides = preOverride.call(this, overrides);
    }

    var obj = this[prop];
    if (!obj && !overrides) {
      return null;
    }

    if (overrides) {
      obj = _.assign({}, obj, overrides);
    }

    return _.size(obj) ? obj : null;
  };
}

Host.prototype.getHeaders = objectPropertyGetter('headers', function (overrides) {
  if (!this.suggestCompression) {
    return overrides;
  }

  return _.defaults(overrides || {}, {
    'Accept-Encoding': 'gzip,deflate'
  });
});

Host.prototype.getQuery = objectPropertyGetter('query', function (query) {
  return typeof query === 'string' ? qs.parse(query) : query;
});

Host.prototype.toString = function () {
  return this.makeUrl();
};
