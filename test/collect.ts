import JStream, { type Path } from '../src';

export default (json: string, path?: Path) =>
  new Promise<unknown[]>((resolve, reject) => {
    const out: unknown[] = [];
    const jstream = new JStream(path);
    jstream
      .on('data', (obj: unknown) => out.push(obj))
      .on('error', reject)
      .on('end', () => resolve(out));
    jstream.end(json);
  });
