import { Transform } from 'node:stream';
import clarinet from 'clarinet';

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

    case 'object':
      return comparator.test(String(key));
  }
};

class JStream extends Transform {
  static JStream = JStream;
  static default = JStream;

  public parser: clarinet.CStream;

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
          pathMatch &&
          stack.length === path.length &&
          match(currKey, comparator)
        ) {
          this.push(value);
        }
      };

      const onopenpath = () => {
        if (stack.length) {
          parentPathMatch = pathMatch =
            parentPathMatch && match(currKey, comparator);
        }

        comparator = path[stack.length];
      };

      parser.on('value', onvaluepath);
      parser.on('openobject', onopenpath);
      parser.on('openarray', onopenpath);
    }

    parser.on('value', (value: unknown) => {
      (currObj as JsonRecord)[currKey] = value;
      if (inArray) {
        (currKey as number)++;
      }
    });

    parser.on('key', (key: string) => {
      currKey = key;
    });

    const onopen = (key?: string) => {
      let obj: JsonContainer;
      let openArray: boolean;
      let nextKey: string | number;

      if (key === undefined) {
        // openarray
        obj = (currObj as JsonRecord)[currKey] = [];
        openArray = true;
        nextKey = 0;
      } else {
        // openobject
        obj = (currObj as JsonRecord)[currKey] = {};
        openArray = false;
        nextKey = key;
      }

      stack.push({
        obj: currObj,
        key: typeof currKey === 'number' && inArray ? currKey + 1 : currKey,
        inArray,
        path: pathMatch,
      });

      currObj = obj;
      currKey = nextKey;
      inArray = openArray;
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

    parser.on('openobject', onopen);
    parser.on('closeobject', onclose);
    parser.on('openarray', onopen);
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
          this.push((currObj as JsonRecord)[currKey]);
        }
        comparator = path[stack.length - 1];
      };

      parser.on('closeobject', onclosepath);
      parser.on('closearray', onclosepath);
    } else {
      // If `path` is not given, emit `data` event whenever a full
      // object on the root is parsed.
      parser.on('closeobject', () => {
        if (!stack.length || (stack.length === 1 && inArray)) {
          const key = inArray ? (currKey as number) - 1 : currKey;
          this.push((currObj as JsonRecord)[key]);
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
   * Writes to the parser.
   */
  override _transform(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (err?: Error | null) => void,
  ): void {
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
