const run  = require('./run');
const path = require('path');


/* eslint quotes:false */
const file1 = path.join(__dirname, 'assets', 'propName.json');
const expected1 = ['foo', 'bar'];

const file2 = path.join(__dirname, 'assets', 'arrayKey.json');
const expected2 = [83, 5, 64, 'grandma'];

const file3 = path.join(__dirname, 'assets', 'regexp.json');
const expected3 = [500, 2000, true];

const file4 = path.join(__dirname, 'assets', 'function.json');
const expected4 = [
  "200",
   [42, { "more": "results" }, 23],
  "long",
  "200",
   [42, { "more": "results" }, 23],
  "long"
];

const file5 = path.join(__dirname, 'assets', 'many.json');
const expected5 = [
  { "_id":  "change1_0.6995461115147918",
    "_rev": "1-e240bae28c7bb3667f02760f6398d508",
    "hello": 1 },
  { "_id":"change2_0.6995461115147918",
    "_rev":"1-13677d36b98c0c075145bb8975105153",
    "hello": 2 }
];


describe('Parse JSON with a path that contains', () => {
  run('a property name', file1, expected1, ['name']);
  run('a boolean and array key', file2, expected2, [true, true, 2]);
  run('a RegExp', file3, expected3, [/^_/]);
  run('a function', file4, expected4, [key => key.length > 5]);
  run('many of the above', file5, expected5, ['rows', true, 'doc']);
});
