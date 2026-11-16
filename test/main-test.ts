import assert from 'node:assert';
import path from 'node:path';
import JStream, { type Path } from '../src';
import run from './run';

const file1 = path.join(__dirname, 'assets', 'data.json');
const expected1 = [
  { hello: 'world' },
  { 0: 'a', 1: 'b', 2: 'c' },
  { list: ['mr', 'plow'] },
  { foo: ['bar', 'baz', 2, { one: 'two' }, ['a', 'b', 'c']], yes: 'no' },
];

const file2 = path.join(__dirname, 'assets', 'array.json');
const expected2 = [
  { id: 'one' },
  { id: 'two' },
  { id: 'three' },
  { id: 'four' },
];

run('Read a file with JSON strings', file1, expected1);
run('Read a file with JSON objects in an array', file2, expected2);

describe('Parse empty containers', () => {
  const collect = (json: string, path?: Path) =>
    new Promise<unknown[]>((resolve, reject) => {
      const out: unknown[] = [];
      const jstream = new JStream(path);
      jstream
        .on('data', (obj: unknown) => out.push(obj))
        .on('error', reject)
        .on('end', () => resolve(out));
      jstream.end(json);
    });

  it('emits an empty object at the root', async () => {
    assert.deepEqual(await collect('{}'), [{}]);
  });

  it('emits an empty object nested in an object', async () => {
    assert.deepEqual(await collect('{"a":{}}'), [{ a: {} }]);
  });

  it('keeps empty objects and arrays nested in arrays', async () => {
    assert.deepEqual(await collect('{"a":[{},{"b":1},[]]}'), [
      { a: [{}, { b: 1 }, []] },
    ]);
  });

  it('emits an empty object matched by path', async () => {
    assert.deepEqual(
      await collect('{"results":[{"id":{}}]}', ['results', true, 'id']),
      [{}],
    );
  });

  it('still emits empty arrays', async () => {
    assert.deepEqual(await collect('{"a":[]}'), [{ a: [] }]);
  });
});

describe('Get exposed MAX_BUFFER_LENGTH', () => {
  it('Returns a value', () => {
    assert.ok(JStream.MAX_BUFFER_LENGTH);
    assert.ok(JStream.MAX_BUFFER_LENGTH > 2);
  });

  describe('Set it to another value', () => {
    it('Is equal to new value', () => {
      JStream.MAX_BUFFER_LENGTH = 256;
      assert.equal(JStream.MAX_BUFFER_LENGTH, 256);
    });
  });
});

describe('Module exports interop', () => {
  it('exports JStream and default aliases', () => {
    assert.strictEqual(typeof JStream, 'function');
    assert.strictEqual(
      (JStream as unknown as Record<string, unknown>).default,
      JStream,
    );
    assert.strictEqual(
      (JStream as unknown as Record<string, unknown>).JStream,
      JStream,
    );
  });
});
