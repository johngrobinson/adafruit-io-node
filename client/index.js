'use strict';

const Swagger = require('swagger-client'),
      Stream = require('./lib/stream'),
      Signature = require('./lib/signature');

class Client {

  constructor(username, key, options) {

    this.host = 'io.adafruit.com';
    this.port = 80;
    this.username = username || false;
    this.key = key || false;
    this.swagger_path = '/api/docs/v1.json';
    this.success = function() {};

    Object.assign(this, options);

    if(! this.username)
      throw new Error('client username is required');

    if(! this.key)
      throw new Error('client key is required');

    new Swagger({
      url: `http://${this.host}:${this.port}${this.swagger_path}`,
      usePromise: true,
      authorizations: {
        HeaderKey: new Swagger.ApiKeyAuthorization('X-AIO-Key', this.key, 'header')
      }
    }).then((client) => {
      this.swagger = client;
      this._defineGetters();
    });

  }

  _defineGetters() {

    Object.keys(this.swagger.apis).forEach(api => {

      if(api === 'help')
        return;

      const stream = new Stream({
        type: api.toLowerCase(),
        username: this.username,
        key: this.key,
        host: this.host,
        port: (this.host === 'io.adafruit.com' ? 8883 : 1883)
      });

      this.swagger[api].readable = (id) => { stream.connect(id); return stream; };
      this.swagger[api].writable = (id) => { stream.connect(id); return stream; };

      Object.defineProperty(this, api, {
        get: () => {
          return this.swagger[api];
        }
      });

    });

    this.success();

  }

  static get Signature() {
    return Signature;
  }

  static get Stream() {
    return Stream;
  }

}

exports = module.exports = Client;
