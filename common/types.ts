import NodeWebSocket from 'ws';
import { Entity } from './entities';
import { Vec2 } from './vec';
import { WorldGeometry } from './utils';

export enum MessageType {
  // Server -> Client
  /** Array of entities sent to client */
  SyncEntities = 0x00,
  /** Request authorization */
  AuthRes = 0x01,
  /** @deprecated, all info sent through SyncEntities */
  SyncPositions = 0x02,

  // Client -> Server
  /** Response for auth */
  AuthReq = 0x10,
  /** Player changes direction */
  Direction = 0x20,
  /** Player shoots food */
  Shoot = 0x30,

  // Both
  UnrecognizedType = 0x80,
  ParseError = 0x81,
}

export type AuthReq = { username: string };
export type AuthRes = { id: number, worldGeom: WorldGeometry };

type M<T extends MessageType, D = any> = { type: T, data?: D };

export type Message =
  | M<MessageType.ParseError, undefined>
  | M<MessageType.UnrecognizedType, undefined>
  | M<MessageType.SyncEntities, Entity[]>
  | M<MessageType.AuthReq, AuthReq>
  | M<MessageType.AuthRes, AuthRes>
  | M<MessageType.Direction, Vec2>
  | M<MessageType.Shoot, undefined>;

export type UID = number;
export type Connection = { uid: UID, socket: NodeWebSocket };
export type Raw = Buffer;
export type Chunk = WeakSet<Entity>;

export interface Serializable {
  pack(this: this): Raw;
}
