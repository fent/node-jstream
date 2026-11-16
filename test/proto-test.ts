import assert from 'node:assert';
import collect from './collect';

describe('Parse __proto__ keys', () => {
  it('keeps them as own data properties', async () => {
    const json = '{"__proto__":{"x":1},"a":2}';
    const [result] = await collect(json);
    assert.deepEqual(result, JSON.parse(json));
    assert.ok(Object.hasOwn(result as object, '__proto__'));
    assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
  });

  it('keeps nested and array-held keys', async () => {
    const json = '{"a":[{"__proto__":{"x":1}}]}';
    const [result] = await collect(json);
    assert.deepEqual(result, JSON.parse(json));
  });
});
