var Stream = require('stream').Stream
  , util = require('util')
  , clarinet = require('clarinet')


/**
 * @constructor
 * @extends (Stream)
 */
var JStream = module.exports = function(path) {
  Stream.call(this);
  this.readable = true;
  this.writable = true;

  var parser = this.parser = new clarinet.createStream()
    , self = this
    , stack = []
    , currObj = {}
    , currKey = 'root'
    , inArray
    , pathMatches = true
    , comparator
    ;

  if (path) {
    // add some listeners only if path is given
    function onvaluepath(value) {
      if (pathMatches && stack.length === path.length - 1
          && match(currKey, comparator)) {
        self.emit('data', value);
      }
    }

    function onopenpath() {
      if (!stack.length) return;
      comparator = path[stack.length - 1];
    }

    parser.on('value', onvaluepath);
    parser.on('openobject', onopenpath);
    parser.on('openarray', onopenpath);
  }


  function onvalue(value) {
    currObj[currKey] = value;
    if (inArray) {
      currKey++;
    }
  }

  function onkey(key) {
    currKey = key;
  }
  
  function onopen(key) {
    if (key === undefined) {
      // openarray
      var obj = currObj[currKey] = [];
      var openArray = true;
      key = 0;

    } else {
      // openobject
      var obj = currObj[currKey] = {};
      var openArray = false;
    }

    stack.push({
      obj: currObj
    , key: currKey + (inArray ? 1 : '')
    , arr: inArray
    , path: pathMatches && (stack.length === 0 ||
      (comparator !== undefined && match(currKey, comparator)))
    });

    currObj = obj;
    currKey = key;
    inArray = openArray;
  }

  function onclose() {
    var parent  = stack.pop();
    currObj     = parent.obj;
    currKey     = parent.key;
    inArray     = parent.arr;
    pathMatches = parent.path;
  }

  parser.on('value', onvalue);
  parser.on('key', onkey);
  parser.on('openobject', onopen);
  parser.on('closeobject', onclose);
  parser.on('openarray', onopen);
  parser.on('closearray', onclose);

  parser.on('error', function onerror(err) {
    self.readable = false;
    self.writable = false;
    self.emit('error', err);
  });

  if (path) {
    function onclosepath() {
      if (pathMatches && stack.length === path.length) {
        self.emit('data', currObj[currKey]);
      }
      comparator = path[stack.length - 1];
    }

    parser.on('closeobject', onclosepath);
    parser.on('closearray', onclosepath);

  } else {
    // if `path` is not given, emit `data` event whenever a full
    // objectd on the root is parsed
    parser.on('closeobject', function onobjectavailable() {
      if (!stack.length) {
        self.emit('data', currObj[currKey]);
      }
    });
  }

};
util.inherits(JStream, Stream);


/**
 * Proxy a bunch of methods to the parser.
 */
['write', 'pause', 'resume'].forEach(function(fn) {
  JStream.prototype[fn] = function(data) {
    return this.parser[fn](data);
  };
});


/**
 * Signals no more data is coming through.
 */
JStream.prototype.end = function() {
  this.emit('end');
};


/**
 * Compare a key against a string, number, RegExp, boolean, or function.
 *
 * @param (string) key
 * @param (string|number|RegExp|boolean|Function) comparator
 * @return (boolean)
 */
function match(key, comparator) {
  switch (typeof comparator) {
    case 'string':
    case 'number':
      return key === comparator;
      break;

    case 'boolean':
      return comparator;
      break;

    case 'function':
      return comparator(key);
      break;

    case 'object':
      if (comparator instanceof RegExp) {
        return comparator.test(key);
      }
      break;

  }

  throw new TypeError('Path object not supported.');
}
