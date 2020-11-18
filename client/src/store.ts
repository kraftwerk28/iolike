import { writable } from 'svelte/store';
import { MessageType, Message } from 'common/types';
import { parse, serialize } from 'common/parser';
import type { Entity } from 'common/entities';
import type { Vec2 } from 'common/utils';

type GameState = {
  wsOpen: boolean,
  authorized: boolean,
  entities: Entity[],
};

function gameStore() {
  const ws = new WebSocket('ws://localhost:8080');
  const { update, set, subscribe } = writable<GameState>({
    wsOpen: false,
    authorized: false,
    entities: [],
  });

  function setState(s: Partial<GameState>) {
    update(state => ({ ...state, ...s }));
  }

  function send(msg: Message) {
    ws.send(serialize(msg));
  }

  function sendAuth(username: string) {
    send({ type: MessageType.AuthReq, data: { username } });
  }

  ws.addEventListener('open', () => {
    setState({ wsOpen: true });
  });

  ws.addEventListener('message', (ev) => {
    const msg = parse(ev.data);
    switch (msg.type) {
      case MessageType.AuthRes:
        setState({ authorized: true });
        break;
      case MessageType.EntityMap:
        setState({ entities: msg.data });
        break;
      default:
        break;
    }
  });

  function sendDirection(direction: Vec2) {
    update((state) => {
      if (!state.wsOpen) return state;
      send({ type: MessageType.Direction, data: direction });
    });
  }

  return {
    update,
    set,
    subscribe,
    setState,
    send,
    sendAuth,
    sendDirection,
  };
}

export const store = gameStore();
