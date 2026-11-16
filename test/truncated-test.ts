import assert from 'node:assert';
import collect from './collect';

describe('Parse incomplete JSON', () => {
  it('emits an error for unclosed containers', async () => {
    await assert.rejects(collect('{"a":'), /Unexpected end/);
    await assert.rejects(collect('[{"a":1}'), /Unexpected end/);
  });

  it('emits an error for an incomplete root array', async () => {
    await assert.rejects(collect('[1,2'), /Unexpected end/);
  });

  it('ends cleanly for empty or whitespace-only input', async () => {
    assert.deepEqual(await collect(''), []);
    assert.deepEqual(await collect(' \n\t'), []);
  });
});
