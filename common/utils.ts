import { Raw, UID, Chunk } from './types';
import { INITIAL_RADIUS } from './constants';

const uidGen = (function*() {
  let i = 0;
  while (true) {
    yield i++;
  }
})();

export const makeUID = (): UID => uidGen.next().value;

export class Vec2 {
  constructor(public x: number, public y: number) { }

  static unpack(obj) {
    const { x, y } = obj;
    return new Vec2(x, y);
  }

  pack() {
    return { x: this.x, y: this.y };
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

  static zero() {
    return new Vec2(0, 0);
  }
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

export function randomPos(
  { mapSize, chunkSize }: WorldGeometry,
  playerRadius: number = INITIAL_RADIUS,
): Vec2 {
  const { random } = Math;
  const k = mapSize * chunkSize - playerRadius * 2;
  return new Vec2(random() * k + playerRadius, random() * k + playerRadius);
}

export class WorldGeometry {
  constructor(public mapSize = 8, public chunkSize = 8) { }
  worldSize() {
    return this.mapSize * this.chunkSize;
  }
}
