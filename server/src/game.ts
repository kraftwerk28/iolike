import WebSocket from 'ws';
import { log } from './logger';
import { parse } from 'common/parser';
import { ChunkPool } from './chunk-pool';
import { Connections } from './connections';
import {
  MessageType,
  WorldGeometry,
  Food,
  Player,
  randomColor,
  randomPos,
  Vec2,
  makeUID,
  INITIAL_RADIUS, FOOD_SIZE,
} from 'common';
import { Args } from './args';

export class GameState {
  private connections = new Connections;
  private chunkPool: ChunkPool;
  private food: Set<Food> = new Set;
  private worldGeometry: WorldGeometry;
  private maxFoodCount: number; ;
  private tickTime: number;
  private tickTimer: NodeJS.Timeout;
  private tickTimestamp = Date.now();
  private foodSpawnChance: number;

  constructor(args: Args) {
    this.worldGeometry = new WorldGeometry(args.worldsize, args.chunksize);
    this.maxFoodCount =
      this.worldGeometry.chunkSize ** 2 * this.worldGeometry.mapSize ** 2;
    this.chunkPool = new ChunkPool(this.worldGeometry);
    this.tickTime = 1000 / args.tps;
    this.foodSpawnChance = args.foodchance;
  }

  onNewConnection(socket: WebSocket) {
    this.connections.add(socket);
    socket
      .on('close', (code, reason) =>
        this.onCloseConnection(socket, code, reason)
      )
      .on('message', (message) => this.onSocketMessage(socket, message));
    log.info('%d connections', this.connections.connCount);
  }

  onCloseConnection(socket: WebSocket, code: number, reason: string) {
    const player = this.connections.getPlayer(socket);
    this.connections.remove(socket);
    this.chunkPool.delete(player);

    log.warn(
      'connection closed; code: `%d`, reason: `%s`',
      code,
      reason,
    );
    log.info('%d connections', this.connections.connCount);
  }

  onSocketMessage(socket: WebSocket, raw: WebSocket.Data) {
    const message = parse(raw);

    switch (message.type) {
      case MessageType.AuthReq: {
        const id = makeUID();
        const player = new Player({
          size: INITIAL_RADIUS,
          pos: Vec2.zero(),
          // pos: randomPos(this.worldGeometry),
          username: message.data.username,
          vel: Vec2.zero(),
          id,
        });
        this.connections.add(socket, player);
        const data = { id, worldGeom: this.worldGeometry };
        this.connections
          .send(player, { type: MessageType.AuthRes, data });
        log.info('new player `%s`', message.data.username);
        // this.players.set(uid, player);
        break;
      }
      case MessageType.Direction: {
        const player = this.connections.getPlayer(socket);
        player.setVel(message.data);
        break;
      }
      case MessageType.Shoot: {
        const player = this.connections.getPlayer(socket);
        player.size -= FOOD_SIZE;
        const foodPos = player.pos.add(player.vel.mul(player.size * 2));
        const foodPiece = new Food(foodPos, FOOD_SIZE, randomColor());
        this.chunkPool.put(foodPiece);
        this.food.add(foodPiece);
      }
      default:
        break;
    }
  }

  tick() {
    const dt = this.deltaTime();
    // Update positions
    for (const player of this.connections.iterPlayers()) {
      player.update(this.worldGeometry, dt);
      this.chunkPool.put(player);

      for (const food of this.food.values()) {
        if (player.collides(food)) {
          player.size += food.size;
          this.food.delete(food);
          this.chunkPool.delete(food);
        }
      }

      for (const otherPlayer of this.connections.iterPlayers()) {
        if (player === otherPlayer) continue;
        if (player.collides(otherPlayer) && player.size > otherPlayer.size) {
          // eatenPlayers.push(otherUID);
          player.size += otherPlayer.size;
          this.chunkPool.delete(otherPlayer);
          this.connections.disconnect(otherPlayer);
        }
      }
    }

    // Spawn food
    if (
      Math.random() < this.foodSpawnChance &&
      this.food.size < this.maxFoodCount
    ) {
      const pos = randomPos(this.worldGeometry);
      const food = new Food(pos, FOOD_SIZE, randomColor());
      this.chunkPool.put(food);
      this.food.add(food);
    }

    this.syncClients();
  }

  private syncClients() {
    for (const [player, allEntities] of this.chunkPool.playersWithChunks()) {
      this.connections.send(player, {
        type: MessageType.SyncEntities,
        data: allEntities,
      });
    }
  }

  run() {
    this.tickTimer = setInterval(this.tick.bind(this), this.tickTime);
    return () => {
      clearInterval(this.tickTimer);
    };
  }

  private deltaTime() {
    const now = Date.now();
    const dt = now - this.tickTimestamp;
    this.tickTimestamp = now;
    return dt;
  }

  handleCommand(command: string) { }
}
