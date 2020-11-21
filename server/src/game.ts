import WebSocket from 'ws';
import { makeUID } from 'common/utils';
import { log } from './logger';
import { parse } from 'common/parser';
import { ChunkPool } from './chunk-pool';
import { Connections } from './connections';
import {
  MessageType,
  UID,
  WorldGeometry,
  Food,
  Player,
  randomColor,
  randomPos,
  Vec2,
  INITIAL_RADIUS, TPS, FOOD_SPAWN_CHANCE, FOOD_SIZE
} from 'common';

export class GameState {
  private connections = new Connections;
  private chunkPool: ChunkPool;

  // private players: Map<UID, Player> = new Map;
  private food: Set<Food> = new Set;

  private worldGeometry = new WorldGeometry;
  private maxFoodCount = this.worldGeometry.chunkSize ** 2 *
    this.worldGeometry.mapSize ** 2;
  private tickTime = 1000 / TPS;
  private tickTimer: NodeJS.Timeout;

  constructor() {
    this.chunkPool = new ChunkPool(this.worldGeometry);
  }

  onNewConnection(socket: WebSocket) {
    this.connections.add(socket);
    socket
      .on('close', (code, reason) =>
        this.onCloseConnection(socket, code, reason)
      )
      .on('message', (message) => this.onSocketMessage(socket, message));
    log.info('Total connections: %d', this.connections.connCount);
  }

  onCloseConnection(socket: WebSocket, code: number, reason: string) {
    const player = this.connections.getPlayer(socket);
    this.connections.remove(socket);
    this.chunkPool.delete(player);
    // this.players.delete(uid);
    log.info(
      'Connection closed; code: %d, reason: %s, total conns: %d',
      code,
      reason,
      this.connections.connCount,
    );
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
        this.connections
          .send(player, { type: MessageType.AuthRes, data: { id } });
        log.info('New player %s', message.data.username);
        // this.players.set(uid, player);
        break;
      }
      case MessageType.Direction: {
        const player = this.connections.getPlayer(socket);
        player.setVel(message.data);
        break;
      }
      default:
        break;
    }
  }

  tick() {
    const defeatedPlayers = [];

    // Update positions
    for (const player of this.connections.iterPlayers()) {
      const eatenPlayers: UID[] = [];
      const eatenFood: Food[] = [];

      player.update(this.worldGeometry);
      this.chunkPool.put(player);

      for (const food of this.food.values()) {
        if (player.collides(food)) {
          eatenFood.push(food);
          player.size += food.size / 10;
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

      for (const food of eatenFood) {
        this.food.delete(food);
        this.chunkPool.delete(food);
      }

      // for (const playerID of eatenPlayers) {
      //   this.players.delete(playerID);
      // }
    }

    // Spawn food
    if (Math.random() < FOOD_SPAWN_CHANCE && this.food.size < this.maxFoodCount) {
      const pos = randomPos(this.worldGeometry);
      const food = new Food(pos, FOOD_SIZE, randomColor());
      this.chunkPool.put(food);
      this.food.add(food);
    }

    this.syncClients();
  }

  private syncClients() {
    for (const [player, allEntities] of this.chunkPool.playersWithChunks()) {
      // log.info('Sending tick to %s', player.username);
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

  handleCommand(command: string) { }
}
