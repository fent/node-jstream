var JStream = require('..');
var assert  = require('assert');
var fs      = require('fs');


describe('Try to parse a non-JSON stream', function() {
  it('Emits an error', function(done) {
    fs.createReadStream(__filename)
      .pipe(new JStream())
      .on('error', function(err) {
        assert.ok(err);
        assert.ok(/Non-whitespace before/.test(err.message));
        done();
      });
  });
});

describe('Give path with unsupported types', function() {
  it('Throws an error on instanstiation', function() {
    assert.throws(function() {
      new JStream('hi');
    }, /must be an array/);
    assert.throws(function() {
      new JStream(['thing', 2, {}]);
    }, /object not supported/);
  });
});
