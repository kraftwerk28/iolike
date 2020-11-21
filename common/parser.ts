import { Message, MessageType, Raw } from './types';
import { Data } from 'ws';
import { Vec2 } from './vec';
import { Entity, Food, Player } from './entities';
import { Buffer } from 'buffer';
import { WorldGeometry } from './utils';

export function unpackEntity(raw: Raw): Entity {
  const entityType = raw.readUInt8(0);
  if (entityType === 0) {
    // type | id | username | size | color | ...positions =
    const id = raw.readUInt32BE(1);
    const username = raw
      .slice(1 + 4, 1 + 4 + 8)
      .toString()
      .replace(/\0/g, '');
    const size = raw.readUInt32BE(1 + 4 + 8);
    const color = raw.readUInt32BE(1 + 4 + 8 + 4);
    const pos = Vec2.unpack(raw.slice(1 + 4 + 8 + 4 + 4));
    const vel = Vec2.unpack(raw.slice(1 + 4 + 8 + 4 + 4 + 8));
    const acc = Vec2.unpack(raw.slice(1 + 4 + 8 + 4 + 4 + 8 + 8));

    return new Player({ size, pos, username, vel, acc, color, id });
  } else if (entityType === 1) {
    const size = raw.readUInt32BE(1);
    const color = raw.readUInt32BE(1 + 4);
    const pos = Vec2.unpack(raw.slice(1 + 4 + 4));
    return new Food(pos, size, color);
  }
}

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
        offset += 4;
        const chunkSize = raw.readUInt32BE(offset);
        offset += 4;
        const mapSize = raw.readUInt32BE(offset);
        const worldGeom = new WorldGeometry(mapSize, chunkSize);
        return { type, data: { id, worldGeom } };
      }

      case MessageType.Shoot: {
        return { type };
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
      const body = Buffer.alloc(4 + 4 + 4);
      body.writeUInt32BE(msg.data.id);
      body.writeUInt32BE(msg.data.worldGeom.chunkSize, 4);
      body.writeUInt32BE(msg.data.worldGeom.mapSize, 8);
      return Buffer.concat([header, body]);
    }

    case MessageType.AuthReq: {
      const body = Buffer.alloc(8);
      body.write(msg.data.username, 0, 8);
      return Buffer.concat([header, body]);
    }

    case MessageType.Shoot:
      return Buffer.from([msg.type]);
  }
}
