var Transform = require('stream').Transform;
var util      = require('util');
var clarinet  = require('clarinet');


/**
 * @constructor
 * @extends {Transform}
 */
var JStream = module.exports = function(path) {
  Transform.call(this, { objectMode: true });

  var parser = this.parser = new clarinet.createStream();
  var self = this;
  var stack = [];
  var currObj = {};
  var currKey = 'root';
  var inArray;
  var pathMatch = true;
  var parentPathMatch = true;
  var comparator;

  if (path) {
    // Check path types.
    if (!Array.isArray(path)) {
      throw TypeError('`path` must be an array');
    }
    for (var i = 0, len = path.length; i < len; i++) {
      var p = path[i];
      if (typeof p !== 'string' && typeof p !== 'number' &&
        typeof p !== 'boolean' && typeof p !== 'function' &&
        !(p instanceof RegExp)) {
        throw TypeError('`path` object not supported');
      }
    }

    // Add some listeners only if path is given.
    var onvaluepath = function onvaluepath(value) {
      if (pathMatch && stack.length === path.length &&
          match(currKey, comparator)) {
        self.push(value);
      }
    };

    var onopenpath = function onopenpath() {
      if (stack.length) {
        parentPathMatch = pathMatch = parentPathMatch &&
          comparator !== undefined &&
          match(currKey, comparator);
      }

      comparator = path[stack.length];
    };

    parser.on('value', onvaluepath);
    parser.on('openobject', onopenpath);
    parser.on('openarray', onopenpath);
  }


  parser.on('value', function onvalue(value) {
    currObj[currKey] = value;
    if (inArray) {
      currKey++;
    }
  });

  parser.on('key', function onkey(key) {
    currKey = key;
  });
  
  function onopen(key) {
    var obj, openArray;

    if (key === undefined) {
      // openarray
      obj = currObj[currKey] = [];
      openArray = true;
      key = 0;

    } else {
      // openobject
      obj = currObj[currKey] = {};
      openArray = false;
    }

    stack.push({
      obj  : currObj,
      key  : currKey + (inArray ? 1 : ''),
      arr  : inArray,
      path : pathMatch
    });

    currObj = obj;
    currKey = key;
    inArray = openArray;
  }

  function onclose() {
    var current = stack.pop();
    currObj     = current.obj;
    currKey     = current.key;
    inArray     = current.arr;
    parentPathMatch = stack.length ? stack[stack.length - 1].path : true;
  }

  parser.on('openobject', onopen);
  parser.on('closeobject', onclose);
  parser.on('openarray', onopen);
  parser.on('closearray', onclose);

  parser.on('error', function onerror(err) {
    self.readable = false;
    self.writable = false;
    parser.emit = function() {};
    self.emit('error', err);
  });

  parser.on('end', self.push.bind(self, null));

  if (path) {
    var onclosepath = function onclosepath() {
      if (pathMatch && stack.length === path.length) {
        self.push(currObj[currKey]);
      }
      comparator = path[stack.length - 1];
    };

    parser.on('closeobject', onclosepath);
    parser.on('closearray', onclosepath);

  } else {
    // If `path` is not given, emit `data` event whenever a full
    // objectd on the root is parsed.
    parser.on('closeobject', function onobjectavailable() {
      if (!stack.length || stack.length === 1 && inArray) {
        var key = inArray ? currKey - 1 : currKey;
        self.push(currObj[key]);
      }
    });
  }

};
util.inherits(JStream, Transform);


// Expose `MAX_BUFFER_LENGTH` from parsing module.
JStream.__defineGetter__('MAX_BUFFER_LENGTH', function() {
  return clarinet.MAX_BUFFER_LENGTH;
});

JStream.__defineSetter__('MAX_BUFFER_LENGTH', function(val) {
  clarinet.MAX_BUFFER_LENGTH = val;
});


/**
 * Writes to the parser.
 *
 * @param {Buffer|String} chunk
 * @param {String} encoding
 * @param {Function(!Error)} callback
 */
JStream.prototype._transform = function(chunk, encoding, callback) {
  this.parser.write(chunk);
  callback(null);
};


/**
 * Compare a key against a string, Number, RegExp, Boolean, or Function.
 *
 * @param {String} key
 * @param {String|Number|RegExp|Boolean|Function} comparator
 * @return {Boolean}
 */
function match(key, comparator) {
  switch (typeof comparator) {
    case 'string':
    case 'number':
      return key === comparator;

    case 'boolean':
      return comparator;

    case 'function':
      return comparator(key);

    case 'object':
      return comparator.test(key);
  }
}
