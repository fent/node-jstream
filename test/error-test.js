const JStream = require('..');
const assert  = require('assert');
const fs      = require('fs');


describe('Try to parse a non-JSON stream', () => {
  it('Emits an error', (done) => {
    fs.createReadStream(__filename)
      .pipe(new JStream())
      .on('error', (err) => {
        assert.ok(err);
        assert.ok(/Non-whitespace before/.test(err.message));
        done();
      });
  });
});

describe('Give path with unsupported types', () => {
  it('Throws an error on instanstiation', () => {
    assert.throws(() => {
      new JStream('hi');
    }, /must be an array/);
    assert.throws(() => {
      new JStream(['thing', 2, {}]);
    }, /object not supported/);
  });
});
