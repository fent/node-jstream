const JStream = require('..');
const assert  = require('assert');
const fs      = require('fs');


/**
 * Tests that a `file` emits `expected` results given a `path`.
 *
 * @param (String) description
 * @param (String) file
 * @param (Array.Object) expected
 * @param (Array.Object) path
 */
module.exports = (description, file, expected, path) => {
  describe(description, () => {
    it('JStream emits expected Javascript objects', (done) => {
      var rs = fs.createReadStream(file);
      var jstream = new JStream(path);
      rs.pipe(jstream);

      var dataEmitted = false;
      var n = 0;

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
