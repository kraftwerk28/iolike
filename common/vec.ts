import { Raw, Serializable } from './types';
import { Buffer } from 'buffer';

export class Vec2 implements Serializable {
  constructor(public x: number, public y: number) { }

  static unpack(raw: Raw) {
    return new Vec2(raw.readFloatBE(0), raw.readFloatBE(4));
  }

  pack() {
    const buf = Buffer.alloc(8);
    buf.writeFloatBE(this.x, 0);
    buf.writeFloatBE(this.y, 4);
    return buf;
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  normalize() {
    const l = this.length;
    return new Vec2(this.x / l, this.y / l);
  }

  mul(n: number) {
    return new Vec2(this.x * n, this.y * n);
  }

  add(other: Vec2) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  static zero() {
    return new Vec2(0, 0);
  }

  fmt() {
    return `(x = ${this.x}, y = ${this.y})`;
  }
}


