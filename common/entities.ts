import { Raw } from './types';
import { getChunkIndex, randomColor, Vec2 } from './utils';

export enum EntityType {
  Food,
  Player,
}

export abstract class Entity {
  constructor(
    public pos: Vec2,
    public vel: Vec2 = new Vec2(0, 0),
  ) { }

  abstract pack(): Raw;
}

export class Player extends Entity {
  public chunkIndex: number;
  public isActive: boolean;
  constructor(
    public pos: Vec2,
    public username: string,
    public color: number,
    public size: number,
  ) {
    super(pos);
  }

  setVel(direction: Vec2) {
    this.vel = direction.normalize();
  }

  update() {
    this.pos = this.pos.add(this.vel);
  }

  collides(other: Player): boolean {
    const dist = (this.pos.x - other.pos.x) ** 2 +
      (this.pos.y - other.pos.y) ** 2;
    return Math.max(this.size, other.size) ** 2 <= dist;
  }

  pack() {
    const { pos, size, username, color } = this;
    return JSON.stringify({ pos, size, username, color });
  }

  static unpack(raw: Raw) {
    const { pos, size, name, color } = JSON.parse(raw);
    return new Player(pos, name, color, size);
  }
}

export class Food extends Entity {
  constructor(
    public pos: Vec2,
    public points: number,
    public color = randomColor(),
  ) {
    super(pos);
  }

  pack() {
    const { pos, color, points } = this;
    return JSON.stringify({ pos, color, points });
  }

  static unpack(raw: Raw) {
    const { pos, color, points } = JSON.parse(raw);
    return new Food(pos, points, color);
  }
}
