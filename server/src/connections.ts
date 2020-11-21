import { Player } from 'common/entities';
import { serialize } from 'common/parser';
import { Message } from 'common/types';
import WebSocket from 'ws';

export class Connections {
  private player2conn: Map<Player, WebSocket> = new Map;
  private conn2player: Map<WebSocket, Player> = new Map;

  get connCount() {
    return this.conn2player.size;
  }

  add(socket: WebSocket, player?: Player) {
    this.conn2player.set(socket, player);
    if (player) {
      this.player2conn.set(player, socket);
    }
  }

  remove(socket: WebSocket) {
    const player = this.conn2player.get(socket);
    this.conn2player.delete(socket);
    if (player) {
      this.player2conn.delete(player);
    }
  }

  disconnect(player: Player) {
    const socket = this.player2conn.get(player);
    this.player2conn.delete(player);
    if (socket) {
      socket.close(1000);
      this.conn2player.delete(socket);
    }
  }

  getSocket(player: Player) {
    return this.player2conn.get(player);
  }

  getPlayer(socket: WebSocket) {
    return this.conn2player.get(socket);
  }

  iterPlayers() {
    return this.player2conn.keys();
  }

  send(player: Player, msg: Message) {
    const socket = this.getSocket(player);
    if (!socket) return
    const raw = serialize(msg);
    socket.send(raw);
  }
}
