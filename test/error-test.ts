import assert from 'node:assert';
import fs from 'node:fs';
import JStream, { type Path } from '../src';

describe('Try to parse a non-JSON stream', () => {
  it('Emits an error', (done) => {
    fs.createReadStream(__filename)
      .pipe(new JStream())
      .on('error', (err: Error) => {
        assert.ok(err);
        assert.ok(/Non-whitespace before/.test(err.message));
        done();
      });
  });
});

describe('Give path with unsupported types', () => {
  it('Throws an error on instanstiation', () => {
    assert.throws(() => {
      new JStream('hi' as unknown as Path);
    }, /must be an array/);
    assert.throws(() => {
      new JStream(['thing', 2, {}] as unknown as Path);
    }, /object not supported/);
  });
});
