import { Transform } from 'node:stream';
import clarinet from 'clarinet';

// @types/clarinet requires a chunk, but clarinet treats it as optional.
declare module 'clarinet' {
  interface CStream {
    end(chunk?: string): void;
  }
}

type PathComparator = JStream.PathComparator;
type Path = JStream.Path;
type JsonRecord = JStream.JsonRecord;
type JsonContainer = JStream.JsonContainer;

interface StackItem {
  obj: JsonContainer;
  key: string | number;
  inArray?: boolean;
  path?: boolean;
}

/**
 * Compare a key against a string, Number, RegExp, Boolean, or Function.
 */
const match = (
  key: string | number,
  comparator: PathComparator | undefined,
): boolean => {
  if (comparator === undefined) {
    return false;
  }
  switch (typeof comparator) {
    case 'string':
    case 'number':
      return key === comparator;

    case 'boolean':
      return comparator;

    case 'function':
      return comparator(key);

    case 'object': {
      // Global and sticky RegExps keep state between calls.
      comparator.lastIndex = 0;
      const matched = comparator.test(String(key));
      comparator.lastIndex = 0;
      return matched;
    }
  }
};

/**
 * Assign to a container without letting a `__proto__` key change its prototype.
 */
const setValue = (
  obj: JsonContainer,
  key: string | number,
  value: unknown,
): void => {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
    return;
  }
  (obj as JsonRecord)[key] = value;
};

class JStream extends Transform {
  static JStream = JStream;
  static default = JStream;

  public parser: clarinet.CStream;
  private _hasContent = false;

  constructor(path?: Path) {
    super({ objectMode: true });

    this.parser = clarinet.createStream();
    const parser = this.parser;
    const stack: StackItem[] = [];
    let currObj: JsonContainer = {};
    let currKey: string | number = 'root';
    let inArray: boolean | undefined;
    let pathMatch = true;
    let parentPathMatch = true;
    let comparator: PathComparator | undefined;

    if (path) {
      // Check path types.
      if (!Array.isArray(path)) {
        throw new TypeError('`path` must be an array');
      }
      for (let i = 0, len = path.length; i < len; i++) {
        const p = path[i];
        if (
          typeof p !== 'string' &&
          typeof p !== 'number' &&
          typeof p !== 'boolean' &&
          typeof p !== 'function' &&
          !(p instanceof RegExp)
        ) {
          throw new TypeError('`path` object not supported');
        }
      }

      // Add some listeners only if path is given.
      const onvaluepath = (value: unknown) => {
        if (
          // `push(null)` ends the stream, so a matched null can't be emitted.
          value !== null &&
          pathMatch &&
          stack.length === path.length &&
          match(currKey, comparator)
        ) {
          this.push(value);
        }
      };

      const onopenpath = () => {
        const isMatch = match(currKey, comparator);

        // Containers below the matched depth don't affect the match.
        if (stack.length <= path.length) {
          if (stack.length) {
            parentPathMatch = pathMatch = parentPathMatch && isMatch;
          }

          comparator = path[stack.length];
        }
      };

      parser.on('value', onvaluepath);
      parser.on('openobject', onopenpath);
      parser.on('openarray', onopenpath);
    }

    parser.on('value', (value: unknown) => {
      setValue(currObj, currKey, value);
      if (inArray) {
        (currKey as number)++;
      }
    });

    parser.on('key', (key: string) => {
      currKey = key;
    });

    const enterContainer = (
      obj: JsonContainer,
      nextKey: string | number,
      opensArray: boolean,
    ) => {
      stack.push({
        obj: currObj,
        key: typeof currKey === 'number' && inArray ? currKey + 1 : currKey,
        inArray,
        path: pathMatch,
      });

      currObj = obj;
      currKey = nextKey;
      inArray = opensArray;
    };

    const onopenobject = (key?: string) => {
      // clarinet passes the object's first child key, or nothing when the
      // object is empty, so the container type comes from the event.
      const obj: JsonContainer = {};
      setValue(currObj, currKey, obj);
      enterContainer(obj, key ?? currKey, false);
    };

    const onopenarray = () => {
      const obj: JsonContainer = [];
      setValue(currObj, currKey, obj);
      enterContainer(obj, 0, true);
    };

    const onclose = () => {
      const current = stack.pop() as StackItem;
      currObj = current.obj;
      currKey = current.key;
      inArray = current.inArray;
      parentPathMatch = stack.length
        ? Boolean(stack[stack.length - 1].path)
        : true;
    };

    parser.on('openobject', onopenobject);
    parser.on('closeobject', onclose);
    parser.on('openarray', onopenarray);
    parser.on('closearray', onclose);

    parser.on('error', (err: Error) => {
      this.readable = false;
      (this as { writable: boolean }).writable = false;
      parser.emit = () => false;
      this.emit('error', err);
    });

    parser.on('end', this.push.bind(this, null));

    if (path) {
      const onclosepath = () => {
        if (pathMatch && stack.length === path.length) {
          // A closed container in an array is stored at the index before the
          // parent's next key.
          const key = inArray ? (currKey as number) - 1 : currKey;
          this.push((currObj as JsonRecord)[key]);
        }
        comparator = path[stack.length - 1];
      };

      parser.on('closeobject', onclosepath);
      parser.on('closearray', onclosepath);
    } else {
      // If `path` is not given, emit a full root object, or every element of
      // a root array, as it finishes parsing.
      const pushCompleted = () => {
        if (!stack.length || (stack.length === 1 && inArray)) {
          const key = inArray ? (currKey as number) - 1 : currKey;
          this.push((currObj as JsonRecord)[key]);
        }
      };
      parser.on('closeobject', pushCompleted);

      parser.on('closearray', () => {
        // Elements of a root array, but not the root array itself.
        if (stack.length === 1 && inArray) {
          this.push((currObj as JsonRecord)[(currKey as number) - 1]);
        }
      });

      parser.on('value', (value: unknown) => {
        // `push(null)` ends the stream, so null elements are skipped.
        if (value !== null && stack.length === 1 && inArray) {
          this.push(value);
        }
      });
    }
  }

  // Expose `MAX_BUFFER_LENGTH` from parsing module.
  static get MAX_BUFFER_LENGTH(): number {
    return clarinet.MAX_BUFFER_LENGTH;
  }

  static set MAX_BUFFER_LENGTH(val: number) {
    (clarinet as { MAX_BUFFER_LENGTH: number }).MAX_BUFFER_LENGTH = val;
  }

  /**
   * Ends the parser so it can report truncated input.
   */
  override _flush(callback: (err?: Error | null) => void): void {
    // An empty or whitespace-only stream is not a truncated document.
    if (this._hasContent) {
      this.parser.end();
    }
    callback();
  }

  /**
   * Writes to the parser.
   */
  override _transform(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (err?: Error | null) => void,
  ): void {
    if (!this._hasContent) {
      this._hasContent = /\S/.test(chunk.toString());
    }
    (
      this.parser as unknown as { write: (chunk: Buffer | string) => void }
    ).write(chunk);
    callback(null);
  }
}

namespace JStream {
  export type PathComparator =
    | string
    | number
    | boolean
    | RegExp
    | ((key: string | number) => boolean);

  export type Path = PathComparator[];

  export type JsonRecord = Record<string | number, unknown>;
  export type JsonContainer = JsonRecord | unknown[];
}

// Statically recognizable exports for Node.js cjs-module-lexer (ESM named import support)
module.exports = JStream;
module.exports.default = JStream;
module.exports.JStream = JStream;

export = JStream;
