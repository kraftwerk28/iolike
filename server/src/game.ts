import WebSocket from 'ws';
import { MessageType, UID } from 'common/types';
import { randomColor, randomPos, WorldGeometry } from 'common/utils';
import { Food, Player } from 'common/entities';
import { FOOD_GAIN, INITIAL_RADIUS } from 'common/constants';
import { log } from './logger';
import { parse } from 'common/parser';
import { ChunkPool } from './chunk-pool';
import { Connections } from './connections';

export class GameState {
  private connections = new Connections;
  private chunkPool: ChunkPool;

  private players: Map<UID, Player> = new Map;
  private food: Set<Food> = new Set;

  private worldGeometry = new WorldGeometry;
  private maxFoodCount = this.worldGeometry.chunkSize ** 2 *
    this.worldGeometry.mapSize ** 2;
  private tickTime = 1000 / 20;
  private tickTimer: NodeJS.Timeout;

  constructor() {
    this.chunkPool = new ChunkPool(this.worldGeometry);
  }

  onNewConnection(socket: WebSocket) {
    log.info('all conns: %d', this.connections.connCount);
    this.connections.add(socket);
    socket
      .on('close', (code, reason) =>
        this.onCloseConnection(socket, code, reason)
      )
      .on('message', (message) => this.onSocketMessage(socket, message));
  }

  onCloseConnection(socket: WebSocket, code: number, reason: string) {
    this.connections.remove(socket);
    // this.players.delete(uid);
    log.info(
      'closed; code: %d, reason: %s, all conns: %d',
      code,
      reason,
      this.connections.connCount,
    );
  }

  onSocketMessage(socket: WebSocket, raw: WebSocket.Data) {
    const message = parse(raw);

    switch (message.type) {
      case MessageType.AuthReq: {
        const player = new Player(
          randomPos(this.worldGeometry),
          INITIAL_RADIUS,
          message.data.username,
        );
        this.connections.add(socket, player);
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
    for (const player of this.players.values()) {
      const eatenPlayers: UID[] = [];
      const eatenFood: Food[] = [];

      player.update(this.worldGeometry);
      this.chunkPool.put(player);

      for (const food of this.food.values()) {
        if (player.collides(food)) {
          eatenFood.push(food);
          player.size += food.size;
        }
      }

      for (const [otherUID, otherPlayer] of this.players.entries()) {
        if (player === otherPlayer) continue;
        if (player.collides(otherPlayer) && player.size > otherPlayer.size) {
          eatenPlayers.push(otherUID);
          player.size += otherPlayer.size;
        }
      }

      for (const food of eatenFood) {
        this.food.delete(food);
      }
      for (const playerID of eatenPlayers) {
        this.players.delete(playerID);
      }
    }

    // Spawn food
    if (Math.random() < 0.01 && this.food.size < this.maxFoodCount) {
      const pos = randomPos(this.worldGeometry);
      const food = new Food(pos, FOOD_GAIN, randomColor());
      this.chunkPool.put(food);
      this.food.add(food);
    }

    this.syncClients();
  }

  private syncClients() {
    for (const [player, allEntities] of this.chunkPool.playersWithChunks()) {
      this.connections.send(player, {
        type: MessageType.EntityMap,
        data: allEntities,
      });
    }
  }

  run() {
    this.tickTimer = setInterval(this.tick.bind(this), this.tickTime);
    return () => {
      clearInterval(this.tickTimer);
    }
  }

  handleCommand(command: string) { }
}
