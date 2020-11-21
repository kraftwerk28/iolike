import { writable } from 'svelte/store';
import { MessageType, Message } from 'common/types';
import { parse, serialize } from 'common/parser';
import { Entity, Player } from 'common/entities';
import { Vec2 } from 'common/vec';
import { WorldGeometry } from 'common/utils';
import { CLIENT_TPS } from 'common/constants';

type GameState = {
  wsOpen: boolean,
  authorized: boolean,
  entities: Entity[],
  playerID: number,
  camSize: Vec2,
  // camCenter: Vec2,
  vpOffset: Vec2,
  worldGeom: WorldGeometry,
  showOutline: boolean,
};
let timestamp = Date.now();

const initial: GameState = {
  wsOpen: false,
  authorized: false,
  entities: [],
  playerID: 0,
  camSize: new Vec2(750, 750),
  vpOffset: Vec2.zero(),
  worldGeom: new WorldGeometry,
  showOutline: false
};

function gameStore() {
  const ws = new WebSocket('ws://localhost:8080');
  ws.binaryType = 'arraybuffer';
  const { update, set, subscribe } = writable<GameState>(initial);
  let emulationTimer;

  function emulationTick() {
    const now = Date.now();
    const dt = now - timestamp;
    timestamp = now;

    update((state) => {
      const camCenter = state.entities
        .find(e => e instanceof Player && e.id === state.playerID)
        .pos;
      const x = state.camSize.x / 2 - camCenter.x;
      const y = state.camSize.y / 2 - camCenter.y;
      const vpOffset = new Vec2(x, y);

      state.entities.forEach((entity) => {
        if (entity instanceof Player) {
          entity.update(state.worldGeom, dt);
        }
      })
      return { ...state, entities: [...state.entities], vpOffset };
    });
  }

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
      case MessageType.AuthRes: {
        const { worldGeom, id: playerID } = msg.data;
        setState({ authorized: true, playerID, worldGeom });
        emulationTimer = setInterval(emulationTick, 1000 / CLIENT_TPS);
        break;
      }
      case MessageType.SyncEntities: {
        update((state) => {
          return { ...state, entities: msg.data };
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

  function shoot() {
    update((state) => {
      if (!(state.wsOpen && state.authorized)) return state;
      send({ type: MessageType.Shoot });
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
    shoot,
  };
}

export const store = gameStore();
