import assert from 'node:assert';
import fs from 'node:fs';
import JStream, { type Path } from '../src';

/**
 * Tests that a `file` emits `expected` results given a `path`.
 *
 * @param {string} description
 * @param {string} file
 * @param {unknown[]} expected
 * @param {Path} [path]
 */
export default (
  description: string,
  file: string,
  expected: unknown[],
  path?: Path,
): void => {
  describe(description, () => {
    it('JStream emits expected Javascript objects', (done) => {
      const rs = fs.createReadStream(file);
      const jstream = new JStream(path);
      rs.pipe(jstream);

      let dataEmitted = false;
      let expectedIndex = 0;

      jstream.on('data', (obj: unknown) => {
        dataEmitted = true;
        assert.deepEqual(obj, expected[expectedIndex++]);
      });

      jstream.on('end', () => {
        assert.ok(dataEmitted);
        done();
      });
    });
  });
};
