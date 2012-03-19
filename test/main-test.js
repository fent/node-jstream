var JStream = require('..')
  , assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , file = path.join(__dirname, 'data.json');


var expected = [
  { "hello": "world" }
, { "0": "a", "1": "b", "2": "c" }
, { "list": ["mr", "plow"] }
, { "foo": [
      "bar"
    , "baz"
    , 2
    , { "one": "two" }
    , ["a", "b", "c"]
    ]
  , "yes": "no"
  }
];

describe('Read a file', function() {
  it('JStream emits Javascript objects', function(done) {
    var n = 0;

    var rs = fs.createReadStream(file);
    var jstream = new JStream();

    rs.pipe(jstream);
    jstream.on('data', function(obj) {
      assert.deepEqual(obj, expected[n++]);
    });

    rs.on('end', done);
  });
});
