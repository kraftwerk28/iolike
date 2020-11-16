import WebSocket from 'ws';
import { MessageType, UID } from 'common/types';
import { log } from './logger';

import { makeUID } from 'common/utils';
import { Entity, Player } from 'common/entities';
import { parse } from './parser';

export class GameState {
  private connections: Map<WebSocket, Player> = new Map;
  private mapSize = 8; // Actual map size = chunkSize * mapSize
  private chunkSize = 8;
  private entityChunks: WeakSet<Entity>[] = [];
  private maxFoodCount = this.chunkSize ** 2 * this.mapSize ** 2;

  constructor() { }

  onNewConnection(socket: WebSocket) {
    if (!this.connections.has(socket)) {
      const uid = makeUID();
      this.connections.set(socket, uid);
      log.info('all conns: %d', this.connections.size);
    }
    socket
      .on('close', (code, reason) =>
        this.onCloseConnection(socket, code, reason)
      )
      .on('message', (message) => this.onSocketMessage(socket, message));
  }

  onCloseConnection(socket: WebSocket, code: number, reason: string) {
    if (this.connections.has(socket)) {
      const uid = this.connections.get(socket);
      this.connections.delete(socket);
      log.info(
        '%d closed; code: %d, reason: %s, all conns: %d',
        uid,
        code,
        reason,
        this.connections.size,
      );
    }
  }

  onSocketMessage(socket: WebSocket, message: WebSocket.Data) {
    const { type, data } = parse(message);
    switch (type) {
      case MessageType.Direction:

    }
    log.info('Message %O', message);
  }

  tick() {

  }

  sync() {

  }

  run() {

  }
}
