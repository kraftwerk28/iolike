import { Player } from 'common/entities';
import { serialize } from 'common/parser';
import { Message } from 'common/types';
import WebSocket from 'ws';

export class Connections {
  private player2conn: Map<Player, WebSocket> = new Map;
  private conn2player: Map<WebSocket, Player> = new Map;
  public connCount = 0;

  add(socket: WebSocket, player?: Player) {
    this.conn2player.set(socket, player);
    this.connCount++;
    if (player) {
      this.player2conn.set(player, socket);
    }
  }

  remove(socket: WebSocket) {
    const player = this.conn2player.get(socket);
    this.conn2player.delete(socket);
    this.connCount--;
    if (player) {
      this.player2conn.delete(player);
    }
  }

  getSocket(player: Player) {
    return this.player2conn.get(player);
  }

  getPlayer(socket: WebSocket) {
    return this.conn2player.get(socket);
  }

  send(player: Player, msg: Message) {
    const socket = this.getSocket(player);
    const raw = serialize(msg);
    socket.send(raw);
  }
}
