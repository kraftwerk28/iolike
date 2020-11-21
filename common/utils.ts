import { Raw, UID, Chunk } from './types';
import { INITIAL_RADIUS } from './constants';
import { Vec2 } from './vec';

const uidGen = (function*() {
  let i = 0;
  while (true) {
    yield i++;
  }
})();

export const makeUID = (): UID => uidGen.next().value;

export function randomColor() {
  const { random, floor } = Math;
  const parts = Array(3).fill(null).map(() => floor(random() * 0x7f));
  let i = floor(random() * 3);
  parts[i] = 0xff - parts[i];
  if (random() > 0.5) {
    i = floor(random() * 3);
    parts[i] = 0xff - parts[i];
  }
  return parts.reduce((a, c) => (a << 8) + c);
}

export function randomPos(
  { mapSize, chunkSize }: WorldGeometry,
  playerRadius: number = INITIAL_RADIUS,
): Vec2 {
  const { random } = Math;
  const k = mapSize * chunkSize - playerRadius * 2;
  return new Vec2(random() * k + playerRadius, random() * k + playerRadius);
}

export class WorldGeometry {
  constructor(public mapSize = 4, public chunkSize = 128) { }
  worldSize() {
    return this.mapSize * this.chunkSize;
  }
}

export function concatTyped(...arrays: Raw[]) {
  const totalLen = arrays.reduce(
    (acc, c) => acc + c.BYTES_PER_ELEMENT * c.length,
    0,
  );
  const buff = Buffer.alloc(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    buff.set(arr, offset);
    offset += arr.length * arr.BYTES_PER_ELEMENT;
  }
  return buff;
}

export function num2csscolor(n: number): string {
  const r = (n & 0xff0000) >> 16;
  const g = (n & 0x00ff00) >> 8;
  const b = (n & 0x0000ff);
  return `rgb(${r}, ${g}, ${b})`;
}
