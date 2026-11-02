import assert from 'node:assert';
import JStream, { JStream as NamedJStream } from '..';

describe('Exports', () => {
  it('Exposes class as default and named export', () => {
    assert.strictEqual(JStream, NamedJStream);
    assert.strictEqual(JStream.JStream, JStream);
    assert.strictEqual(JStream.default, JStream);
  });
});
