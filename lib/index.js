const Transform = require('stream').Transform;
const clarinet  = require('clarinet');


/**
 * Compare a key against a string, Number, RegExp, Boolean, or Function.
 *
 * @param {string} key
 * @param {string|number|regExp|boolean|function} comparator
 * @return {boolean}
 */
const match = (key, comparator) => {
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
};

module.exports = class JStream extends Transform {
  /**
   * @constructor
   * @extends {Transform}
   */
  constructor(path) {
    super({ objectMode: true });

    const parser = this.parser = new clarinet.createStream();
    const stack = [];
    let currObj = {};
    let currKey = 'root';
    let inArray;
    let pathMatch = true;
    let parentPathMatch = true;
    let comparator;

    if (path) {
      // Check path types.
      if (!Array.isArray(path)) {
        throw TypeError('`path` must be an array');
      }
      for (let i = 0, len = path.length; i < len; i++) {
        let p = path[i];
        if (typeof p !== 'string' && typeof p !== 'number' &&
          typeof p !== 'boolean' && typeof p !== 'function' &&
          !(p instanceof RegExp)) {
          throw TypeError('`path` object not supported');
        }
      }

      // Add some listeners only if path is given.
      const onvaluepath = (value) => {
        if (pathMatch && stack.length === path.length &&
            match(currKey, comparator)) {
          this.push(value);
        }
      };

      const onopenpath = () => {
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


    parser.on('value', (value) => {
      currObj[currKey] = value;
      if (inArray) {
        currKey++;
      }
    });

    parser.on('key', (key) => {
      currKey = key;
    });
    
    const onopen = (key) => {
      let obj, openArray;

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
    };

    const onclose = () => {
      const current = stack.pop();
      currObj     = current.obj;
      currKey     = current.key;
      inArray     = current.arr;
      parentPathMatch = stack.length ? stack[stack.length - 1].path : true;
    };

    parser.on('openobject', onopen);
    parser.on('closeobject', onclose);
    parser.on('openarray', onopen);
    parser.on('closearray', onclose);

    parser.on('error', (err) => {
      this.readable = false;
      this.writable = false;
      parser.emit = () => {};
      this.emit('error', err);
    });

    parser.on('end', this.push.bind(this, null));

    if (path) {
      const onclosepath = () => {
        if (pathMatch && stack.length === path.length) {
          this.push(currObj[currKey]);
        }
        comparator = path[stack.length - 1];
      };

      parser.on('closeobject', onclosepath);
      parser.on('closearray', onclosepath);

    } else {
      // If `path` is not given, emit `data` event whenever a full
      // objectd on the root is parsed.
      parser.on('closeobject', () => {
        if (!stack.length || stack.length === 1 && inArray) {
          let key = inArray ? currKey - 1 : currKey;
          this.push(currObj[key]);
        }
      });
    }

  }


  // Expose `MAX_BUFFER_LENGTH` from parsing module.
  static get MAX_BUFFER_LENGTH() {
    return clarinet.MAX_BUFFER_LENGTH;
  }

  static set MAX_BUFFER_LENGTH(val) {
    clarinet.MAX_BUFFER_LENGTH = val;
  }


  /**
   * Writes to the parser.
   *
   * @param {Buffer|string} chunk
   * @param {string} encoding
   * @param {Function(!Error)} callback
   */
  _transform(chunk, encoding, callback) {
    this.parser.write(chunk);
    callback(null);
  }
};
