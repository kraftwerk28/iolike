import NodeWebSocket from 'ws';
import { Entity } from './entities';
import { Vec2 } from './vec';
import { Buffer } from 'buffer';

export enum MessageType {
  // Server -> Client
  /** Array of players sent to client */
  SyncEntities = 0x00,
  // SyncPositions = 0x02,
  /** If auth was successful */
  AuthRes = 0x01,

  // Client -> Server
  /** Nickname, password etc. */
  AuthReq = 0x10,
  Direction = 0x20,

  // Both
  UnrecognizedType = 0x80,
  ParseError = 0x81,
}

export type AuthReq = {
  username: string
};

export type AuthRes = { id: number };

type M<T extends MessageType, D = any> = { type: T, data?: D };

export type Message =
  | M<MessageType.ParseError, undefined>
  | M<MessageType.UnrecognizedType, undefined>
  | M<MessageType.SyncEntities, Entity[]>
  | M<MessageType.AuthReq, AuthReq>
  | M<MessageType.AuthRes, AuthRes>
  | M<MessageType.Direction, Vec2>;

export type UID = number;

export type Connection = { uid: UID, socket: NodeWebSocket };
export type Raw = Buffer;
export type Chunk = WeakSet<Entity>;

export interface Serializable {
  pack(this: this): Raw;
}
