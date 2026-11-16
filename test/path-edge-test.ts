import assert from 'node:assert';
import collect from './collect';

describe('Parse path matches inside arrays', () => {
  it('emits object elements of matching arrays', async () => {
    assert.deepEqual(await collect('[{"x":1},{}]', [true]), [{ x: 1 }, {}]);
    assert.deepEqual(await collect('{"a":[{"x":1},{"x":2}]}', ['a', true]), [
      { x: 1 },
      { x: 2 },
    ]);
  });

  it('emits array elements of matching arrays', async () => {
    assert.deepEqual(await collect('{"a":[[1],[2]]}', ['a', true]), [[1], [2]]);
  });

  it('matches containers that hold other containers', async () => {
    assert.deepEqual(await collect('{"a":{"b":{"c":1}}}', ['a']), [
      { b: { c: 1 } },
    ]);
    assert.deepEqual(await collect('[{"a":{"b":1}}]', [true]), [
      { a: { b: 1 } },
    ]);
  });

  it('skips matched nulls without ending the stream', async () => {
    assert.deepEqual(await collect('{"a":null}{"a":1}', ['a']), [1]);
    assert.deepEqual(
      await collect('{"results":[{"id":null},{"id":1}]}', [
        'results',
        true,
        'id',
      ]),
      [1],
    );
  });

  it('resets global RegExp state between keys', async () => {
    const regexp = /^a$/g;
    assert.deepEqual(await collect('{"a":1,"a":2,"a":3}', [regexp]), [1, 2, 3]);
    assert.equal(regexp.lastIndex, 0);
  });
});
