# node-jstream [![Build Status](https://secure.travis-ci.org/fent/node-jstream.png)](http://travis-ci.org/fent/node-jstream)

Continuously reads in JSON and outputs Javascript objects. Meant to be used with keep-alive connections that send back JSON on updates.

# Usage

```js
var JStream = require('jstream');
var http = require('http');

http.request({ host: 'myhost.com', path: '/' }, function(res) {
  res.pipe(new JStream()).on('data', function(obj) {
    console.log('new js object');
    console.log(obj);
  });
});
```

# API
### new JStream([path])
Creates an instance of JStream. Inherits from `Stream`. Can be written to and emits `data` events with Javascript objects.

`path` can be an array of property names, `RegExp`'s, booleans, and/or functions. Objects that match will be emitted in `data` events. Passing no `path` means emitting whole Javascript objects as they come in.

# Install

    npm install jstream


# Tests
Tests are written with [mocha](http://visionmedia.github.com/mocha/)

```bash
npm test
```

# License
MIT
