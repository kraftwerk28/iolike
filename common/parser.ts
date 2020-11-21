import { Message, MessageType, Raw } from './types';
import { Data } from 'ws';
import { Vec2 } from './vec';
import { Food, Player, unpackEntity } from './entities';
import { Buffer } from 'buffer';

export function parse(_raw: Data): Message {
  const raw = Buffer.from(_raw);

  try {
    const type = raw.readUInt8();
    let offset = 1;

    // Reject non-binary payloads
    if (typeof raw === 'string') {
      throw new Error();
    }

    switch (type) {
      case MessageType.Direction: {
        return { type, data: Vec2.unpack(raw.slice(offset)) };
      }

      case MessageType.SyncEntities: {
        let entityCount = raw.readUInt32BE(offset);
        offset += 4;
        const entities = [];
        while (entityCount--) {
          const entity = unpackEntity(raw.slice(offset));
          if (entity instanceof Player) {
            offset += 45;
          } else if (entity instanceof Food) {
            offset += 17;
          }
          entities.push(entity);
        }
        return { type, data: entities };
      }

      case MessageType.AuthReq: {
        const username = raw.slice(offset, offset + 8).toString();
        return { type, data: { username } };
      }

      case MessageType.AuthRes: {
        const id = raw.readUInt32BE(offset);
        return { type, data: { id } };
      }

      default:
        return { type: MessageType.UnrecognizedType };

    }
  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      throw err;
    }
    return { type: MessageType.ParseError };
  }
}

export function serialize(msg: Message): Raw {
  const header = Buffer.from([msg.type]);

  switch (msg.type) {
    case MessageType.Direction:
      return Buffer.concat([header, msg.data.pack()]);

    case MessageType.SyncEntities: {
      const nentities = Buffer.alloc(4);
      nentities.writeUInt32BE(msg.data.length);
      return Buffer.concat([
        header,
        nentities,
        ...msg.data.map((e) => e.pack()),
      ]);
    }

    case MessageType.AuthRes: {
      const body = Buffer.alloc(4);
      body.writeUInt32BE(msg.data.id);
      return Buffer.concat([header, body]);
    }

    case MessageType.AuthReq: {
      const body = Buffer.alloc(8);
      body.write(msg.data.username, 0, 8);
      return Buffer.concat([header, body]);
    }
  }
}
