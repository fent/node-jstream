var Stream = require('stream').Stream
  , util = require('util')
  , clarinet = require('clarinet')


/**
 * @constructor
 * @extends (Stream)
 */
var JStream = module.exports = function() {
  Stream.call(this);
  this.readable = true;
  this.writable = true;

  var parser = this.parser = new clarinet.createStream()
    , self = this
    , stack = []
    , currObj = {}
    , currKey = 'root'
    , inArray
    ;

  parser.on('value', function(value) {
    currObj[currKey] = value;
    if (inArray) {
      currKey++;
    }
  });

  parser.on('openobject', function(key) {
    var obj = currObj[currKey] = {};
    stack.push({
      obj: currObj
    , key: currKey + (inArray ? 1 : '')
    , arr: inArray
    });
    currObj = obj;
    currKey = key;
    inArray = false;
  });

  parser.on('key', function(key) {
    currKey = key;
  });

  parser.on('closeobject', function() {
    var parent = stack.pop();
    currObj = parent.obj;
    currKey = parent.key;
    inArray = parent.arr;

    if (!stack.length) {
      self.emit('data', currObj[currKey]);
    }
  });

  parser.on('openarray', function() {
    var obj = currObj[currKey] = [];
    stack.push({
      obj: currObj
    , key: currKey + (inArray ? 1 : '')
    , arr: inArray
    });
    currObj = obj;
    currKey = 0;
    inArray = true;
  });

  parser.on('closearray', function() {
    var parent = stack.pop();
    currObj = parent.obj;
    currKey = parent.key;
    inArray = parent.arr;
  });

  parser.on('error', function(err) {
    self.emit('error', err);
  });

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
