import { Raw, UID, Chunk } from './types';

const uidGen = (function*() {
  let i = 0;
  while (true) {
    yield i++;
  }
})();

export const makeUID = (): UID => uidGen.next().value;

export class Vec2 {
  constructor(public x: number, public y: number) { }
  pack() {
    return JSON.stringify([this.x.toFixed(2), this.y.toFixed(2)]);
  }
  static unpack(raw: Raw) {
    const { x, y } = JSON.parse(raw);
    return new Vec2(x, y);
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  normalize() {
    const l = this.length;
    return new Vec2(this.x / l, this.y / l);
  }

  add(other: Vec2) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }
}

export function getChunkIndex(
  position: Vec2,
  mapSize: number,
  chunkSize: number,
): number {
  const { floor } = Math;
  const [x, y] = [floor(position.x / chunkSize), floor(position.y / chunkSize)];
  return y * mapSize + x;
}

export function getChunkCluster(
  mapSize: number,
  chunkIndex: number,
  chunks: Chunk[],
) {
  let center = new Vec2(chunkIndex % mapSize, Math.floor(chunkIndex / mapSize));
  let positions = [center];
  const { x, y } = center;
  if (x > 0) {
    positions.push(new Vec2(x - 1, y));
  }
  if (y > 0) {
    positions.push(new Vec2(x, y - 1));
  }
  if (x < mapSize - 1) {
    positions.push(new Vec2(x + 1, y));
  }
  if (y < mapSize - 1) {
    positions.push(new Vec2(x, y + 1));
  }

  if (x > 0 && y > 0) {
    positions.push(new Vec2(x - 1, y - 1));
  }
  if (x < mapSize - 1 && y > 0) {
    positions.push(new Vec2(x + 1, y - 1));
  }
  if (x > 0 && y < mapSize - 1) {
    positions.push(new Vec2(x - 1, y + 1));
  }
  if (x < mapSize - 1 && y < mapSize - 1) {
    positions.push(new Vec2(x + 1, y + 1));
  }
  return positions.map(vec => chunks[vec.y * mapSize + vec.x]);
}

export function randomColor() {
  const { random, floor } = Math;
  const parts = Array(3).fill(null).map(() => floor(random() * 0x7f));
  let i = floor(random() * 3);
  parts[i] = 0xff - parts[i];
  if (random() > 0.5) {
    i = floor(random() * 3);
    parts[i] = 0xff - parts[i];
  }
  return parts.reduce((a, c) => a + c);
}
