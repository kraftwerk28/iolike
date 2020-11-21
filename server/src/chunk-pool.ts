import { Entity, Player, WorldGeometry, Vec2 } from 'common';
import { log } from './logger';

export class ChunkPool {
  private chunks: Set<Entity>[];
  private chunkIndexes: Map<Entity, number> = new Map();

  constructor(public worldGeom: WorldGeometry) {
    this.chunks = Array(worldGeom.mapSize ** 2)
      .fill(null)
      .map(() => new Set());
  }

  put(entity: Entity) {
    const prevIndex = this.chunkIndexes.get(entity);
    if (prevIndex) {
      this.chunkIndexes.delete(entity);
      this.chunks[prevIndex].delete(entity);
    }
    const chunkIndex = this.getChunkIndex(entity.pos, this.worldGeom);
    this.chunks[chunkIndex].add(entity);
    this.chunkIndexes.set(entity, chunkIndex);
  }

  delete(entity: Entity) {
    const index = this.chunkIndexes.get(entity);
    log.info('Removing player from index %d', index);
    if (!index) return;
    this.chunks[index].delete(entity);
  }

  private getChunkIndex(
    position: Vec2,
    { mapSize, chunkSize }: WorldGeometry
  ): number {
    const { floor } = Math;
    const x = floor(position.x / chunkSize);
    const y = floor(position.y / chunkSize);
    return y * mapSize + x;
  }

  getClusterIndexes(index: number): number[] {
    const x = index % this.worldGeom.mapSize;
    const y = Math.floor(index / this.worldGeom.mapSize);
    const s = this.worldGeom.mapSize - 1;
    const positions: Vec2[] = [new Vec2(x, y)];
    if (x > 0) {
      positions.push(new Vec2(x - 1, y));
    }
    if (y > 0) {
      positions.push(new Vec2(x, y - 1));
    }
    if (x < s) {
      positions.push(new Vec2(x + 1, y));
    }
    if (y < s) {
      positions.push(new Vec2(x, y + 1));
    }
    if (x > 0 && y > 0) {
      positions.push(new Vec2(x - 1, y - 1));
    }
    if (x < s && y > 0) {
      positions.push(new Vec2(x + 1, y - 1));
    }
    if (x > 0 && y < s) {
      positions.push(new Vec2(x - 1, y + 1));
    }
    if (x < s && y < s) {
      positions.push(new Vec2(x + 1, y + 1));
    }
    return positions.map((vec) => vec.y * this.worldGeom.mapSize + vec.x);
  }

  *playersWithChunks(): Generator<[Player, Entity[]]> {
    for (const [idx, chunk] of this.chunks.entries()) {
      const indexes = this.getClusterIndexes(idx);
      const chunks: Entity[] = indexes
        .map((i) => this.chunks[i])
        .reduce((acc, c) => acc.concat(Array.from(c)), []);
      for (const entity of chunk.values()) {
        if (!(entity instanceof Player)) continue;
        yield [entity, chunks];
      }
    }
  }
}
