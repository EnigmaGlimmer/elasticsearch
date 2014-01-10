/* jshint browser:true */
var expect = require('expect.js');

describe('elasticsearch namespace', function () {
  var es = window.elasticsearch;
  it('is defined on the window', function () {
    expect(es).to.be.ok();
  });
  it('has Client, ConnectionPool, Transport, and errors keys', function () {
    expect(es).to.have.keys('Client', 'ConnectionPool', 'Transport', 'errors');
  });
  it('can create a client', function () {
    var client = new es.Client({ hosts: null });
    expect(client).to.be.a(es.Client);
    client.close();
  });
});