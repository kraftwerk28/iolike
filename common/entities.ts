import { FOOD_SIZE } from './constants';
import { randomColor, Vec2, WorldGeometry } from './utils';

export enum EntityType {
  Food,
  Player,
}

export abstract class Entity {
  constructor(
    public pos: Vec2,
    public size: number,
    public color: number = randomColor(),
    public vel: Vec2 = new Vec2(0, 0),
  ) { }

  abstract pack(): Record<string, any>;

  collides(other: Entity): boolean {
    const dist = (this.pos.x - other.pos.x) ** 2 +
      (this.pos.y - other.pos.y) ** 2;
    return Math.max(this.size, other.size) ** 2 <= dist;
  }
}

export class Player extends Entity {
  constructor(
    public pos: Vec2,
    public size: number,
    public username: string,
    public color: number = randomColor(),
    public vel: Vec2 = Vec2.zero(),
  ) {
    super(pos, size);
  }

  setVel(direction: Vec2) {
    this.vel = direction.normalize();
  }

  update(worldGeom: WorldGeometry) {
    const newPos = this.pos.add(this.vel);
    const s = worldGeom.worldSize();
    if (newPos.x > 0 && newPos.y > 0 && newPos.x < s - 1 && newPos.y < s - 1) {
      this.pos = newPos;
    }
  }

  pack() {
    const { pos, size, username, color, vel } = this;
    return {
      type: EntityType.Player,
      pos,
      size,
      username,
      color,
      vel
    };
  }
}

export class Food extends Entity {
  constructor(
    public pos: Vec2,
    public size = FOOD_SIZE,
    public color: number,
  ) {
    super(pos, size, color);
  }

  pack() {
    const { pos, size, color } = this;
    return { type: EntityType.Food, size, pos, color };
  }
}

export function unpackEntity(obj: Record<string, any>): Entity {
  const pos = Vec2.unpack(obj.pos);
  const { size, color } = obj;

  if (obj.type === EntityType.Food) {
    return new Food(pos, size, color)
  } else if (obj.type === EntityType.Player) {
    const vel = Vec2.unpack(obj.vel);
    return new Player(pos, size, obj.username, color, vel);
  }
}
