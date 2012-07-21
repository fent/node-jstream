var run  = require('./run')
  , path = require('path')
  , file = path.join(__dirname, 'assets', 'data.json')
  ;


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


run('Read a file with several JSON strings', file, expected);
