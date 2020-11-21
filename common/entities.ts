import { FOOD_SIZE, PLAYER_SPEED_SCALE } from './constants';
import { Raw, Serializable } from './types';
import { makeUID, randomColor, WorldGeometry } from './utils';
import { Vec2 } from './vec';
import { Buffer } from 'buffer';

export enum EntityType {
  Food,
  Player,
}

export abstract class Entity {
  constructor(
    public size: number,
    public pos: Vec2,
    public color: number = randomColor()
  ) {}

  abstract pack(): Raw;

  collides(other: Entity): boolean {
    const dist =
      (this.pos.x - other.pos.x) ** 2 + (this.pos.y - other.pos.y) ** 2;
    return Math.max(this.size, other.size) ** 2 >= dist;
  }
}

export class Player extends Entity implements Serializable {
  public size: number;
  public pos: Vec2;
  public username: string;
  public id = makeUID();
  public vel: Vec2 = Vec2.zero();
  public acc: Vec2 = Vec2.zero();
  public color: number = randomColor();

  constructor(init: Partial<Player>) {
    super(init.size, init.pos, init.color);
    Object.assign(this, init);
  }

  setVel(direction: Vec2) {
    this.vel = direction.normalize().mul(2);
  }

  update(worldGeom: WorldGeometry, deltaTime: number) {
    const newPos = new Vec2(
      this.pos.x + this.vel.x * deltaTime * PLAYER_SPEED_SCALE,
      this.pos.y + this.vel.y * deltaTime * PLAYER_SPEED_SCALE,
    );
    const s = worldGeom.worldSize();
    if (newPos.x - this.size < 0) newPos.x = this.size;
    if (newPos.x + this.size > s) newPos.x = s - this.size;
    if (newPos.y - this.size < 0) newPos.y = this.size;
    if (newPos.y + this.size > s) newPos.y = s - this.size;
    this.pos = newPos;
  }

  pack(): Raw {
    // type 1 | id 4 | username 8 | size 4 | color 4 | ...positions = 45 bytes
    const buf = Buffer.alloc(1 + 4 + 8 + 4 + 4);
    buf.writeUInt8(0);
    buf.writeUInt32BE(this.id, 1);
    buf.write(this.username, 4 + 1, 8);
    buf.writeUInt32BE(this.size, 4 + 1 + 8);
    buf.writeUInt32BE(this.color, 1 + 4 + 8 + 4);
    return Buffer.concat([
      buf,
      this.pos.pack(),
      this.vel.pack(),
      this.acc.pack(),
    ]);
  }
}

export class Food extends Entity {
  constructor(
    public pos: Vec2,
    public size = FOOD_SIZE,
    public color: number = randomColor()
  ) {
    super(size, pos, color);
  }

  pack() {
    // type 1 | size 4 | color 4 | pos 8 = 17
    const { size, color } = this;
    const buf = Buffer.alloc(1 + 4 + 4);
    buf.writeUInt8(1);
    buf.writeUInt32BE(size, 1);
    buf.writeUInt32BE(color, 1 + 4);
    return Buffer.concat([buf, this.pos.pack()]);
  }
}
