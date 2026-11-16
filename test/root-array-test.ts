import assert from 'node:assert';
import collect from './collect';

describe('Parse root arrays without a path', () => {
  it('emits every object element', async () => {
    assert.deepEqual(await collect('[{"a":1},{}]'), [{ a: 1 }, {}]);
  });

  it('emits primitive and array elements', async () => {
    assert.deepEqual(await collect('[1,"two",true,[2],[],{}]'), [
      1,
      'two',
      true,
      [2],
      [],
      {},
    ]);
  });

  it('skips null elements', async () => {
    assert.deepEqual(await collect('[null,1,null]'), [1]);
  });

  it('emits elements of concatenated root arrays', async () => {
    assert.deepEqual(await collect('[1,2][3]'), [1, 2, 3]);
  });

  it('still emits a whole root object', async () => {
    assert.deepEqual(await collect('{"a":[1,2]}'), [{ a: [1, 2] }]);
  });
});
