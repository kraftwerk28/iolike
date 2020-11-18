import { Message, MessageType, Raw } from './types';
import { Data } from 'ws';
import { Vec2 } from './utils';
import { Entity, unpackEntity } from './entities';

export function parse(raw: Data): Message {
  try {
    if (typeof raw !== 'string') {
      throw new Error;
    }
    const { type, data } = JSON.parse(raw);

    switch (type) {
      case MessageType.Direction: {
        const { x, y } = data;
        return { type, data: new Vec2(x, y) };
      }
      case MessageType.EntityMap: {
        return { type, data: data.map(unpackEntity) };
      }
      default:
        return { type, data };

    }

  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      throw err;
    }
    return { type: MessageType.ParseError };
  }
}

export function serialize(msg: Message): Raw {
  let pojo = { type: msg.type, data: msg.data };
  const { type } = msg;

  switch (msg.type) {
    case MessageType.EntityMap:
      pojo = { type, data: msg.data.map((entity: Entity) => entity.pack()) };
      break;
    case MessageType.Direction:
      pojo = { type, data: msg.data.pack() };
    default:
      break;
  }
  return JSON.stringify(pojo);
}
