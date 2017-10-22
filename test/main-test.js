const JStream = require('..');
const run     = require('./run');
const assert  = require('assert');
const path    = require('path');


/* jshint quotmark:false */
const file1 = path.join(__dirname, 'assets', 'data.json');
const expected1 = [
  { "hello": "world" },
  { "0": "a", "1": "b", "2": "c" },
  { "list": ["mr", "plow"] },
  { "foo": [
      "bar",
      "baz",
      2,
      { "one": "two" },
      ["a", "b", "c"],
    ],
    "yes": "no"
  }
];

const file2 = path.join(__dirname, 'assets', 'array.json');
const expected2 = [
  { "id": "one" },
  { "id": "two" },
  { "id": "three" },
  { "id": "four" }
];

run('Read a file with JSON strings', file1, expected1);
run('Read a file with JSON objects in an array', file2, expected2);

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
