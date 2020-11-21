import { writable } from 'svelte/store';
import { MessageType, Message } from 'common/types';
import { parse, serialize } from 'common/parser';
import { Entity, Player } from 'common/entities';
import { Vec2 } from 'common/vec';

type GameState = {
  wsOpen: boolean,
  authorized: boolean,
  entities: Entity[],
  playerID: number,
  camSize: Vec2,
  // camCenter: Vec2,
  vpOffset: Vec2,
};

const initial: GameState = {
  wsOpen: false,
  authorized: false,
  entities: [],
  playerID: 0,
  camSize: new Vec2(500, 500),
  vpOffset: Vec2.zero(),
};

function gameStore() {
  const ws = new WebSocket('ws://localhost:8080');
  ws.binaryType = 'arraybuffer';
  const { update, set, subscribe } = writable<GameState>(initial);

  function setState(s: Partial<GameState>) {
    update((state) => ({ ...state, ...s }));
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
        setState({ authorized: true, playerID: msg.data.id });
        break;
      case MessageType.SyncEntities: {
        update((state) => {
          const camCenter = msg.data
            .find(e => e instanceof Player && e.id === state.playerID)
            .pos;
          const x = state.camSize.x / 2 - camCenter.x;
          const y = state.camSize.y / 2 - camCenter.y;
          const vpOffset = new Vec2(
            x > 0 ? 0 : x,
            y > 0 ? 0 : y,
          );
          return { ...state, entities: msg.data, vpOffset };
        });
        break;
      }
      default:
        break;
    }
  });

  function sendDirection(direction: Vec2) {
    update((state) => {
      if (!(state.wsOpen && state.authorized)) return state;
      send({ type: MessageType.Direction, data: direction });
      return state;
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
