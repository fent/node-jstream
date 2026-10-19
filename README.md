# node-jstream

Continuously reads in JSON and outputs Javascript objects. Meant to be used with keep-alive connections that send back JSON on updates.

[![npm version](https://img.shields.io/npm/v/jstream.svg)](https://npmjs.org/package/jstream)
[![Node CI](https://github.com/fent/node-jstream/actions/workflows/nodejs.yml/badge.svg)](https://github.com/fent/node-jstream/actions/workflows/nodejs.yml)
[![codecov](https://codecov.io/gh/fent/node-jstream/branch/master/graph/badge.svg)](https://codecov.io/gh/fent/node-jstream)

# Usage

```js
const JStream = require('jstream');
const request = require('request');

request('http://api.myhost.com/updates.json')
  .pipe(new JStream()).on('data', (obj) => {
    console.log('new js object');
    console.log(obj);
  });
```

# API
### new JStream([path])
Creates an instance of JStream. Inherits from `Stream`. Can be written to and emits `data` events with Javascript objects.

`path` can be an array of property names, `RegExp`'s, booleans, and/or functions. Objects that match will be emitted in `data` events. Passing no `path` means emitting whole Javascript objects as they come in. For example, given the `path` `['results', true, 'id']` and the following JSON gets written into JStream

```js
{ "results": [
  {"seq":99230
  ,"id":"newsemitter"
  ,"changes":[{"rev":"5-aca7782ab6beeaef30c36b888f817d2e"}]}
, {"seq":99235
  ,"id":"chain-tiny"
  ,"changes":[{"rev":"19-82224279a743d2744f10d52697cdaea9"}]}
, {"seq":99238
  ,"id":"Hanzi"
  ,"changes":[{"rev":"4-5ed20f975bd563ae5d1c8c1d574fe24c"}],"deleted":true}
] }
```

JStream will emit `newsemitter`, `chain-tiny`, and `Hanzi` in its `data` event.

### JStream.MAX_BUFFER_LENGTH

Defaults to 64 * 1024.


# Install

    npm install jstream


# Tests
Tests are written with [mocha](https://mochajs.org)

```bash
npm test
```
