const JStream = require('..');
const assert  = require('assert');
const fs      = require('fs');


/**
 * Tests that a `file` emits `expected` results given a `path`.
 *
 * @param {string} description
 * @param {string} file
 * @param {Array.<Object>} expected
 * @param {Array.<Object>} path
 */
module.exports = (description, file, expected, path) => {
  describe(description, () => {
    it('JStream emits expected Javascript objects', (done) => {
      const rs = fs.createReadStream(file);
      const jstream = new JStream(path);
      rs.pipe(jstream);

      let dataEmitted = false;
      let n = 0;

      jstream.on('data', (obj) => {
        dataEmitted = true;
        assert.deepEqual(obj, expected[n++]);
      });

      jstream.on('end', () => {
        assert.ok(dataEmitted);
        done();
      });
    });
  });
};
