import NodeWebSocket from 'ws';
import { Entity } from './entities';
import { Vec2 } from './utils';

export enum MessageType {
  // Server -> Client
  /** Array of players sent to client */
  EntityMap = 0x00,
  /** If auth was successful */
  AuthRes = 0x01,

  // Client -> Server
  /** Nickname, password etc. */
  AuthReq = 0x10,
  Direction = 0x20,

  // Both
  ParseError = 0x80,
}

export type AuthReq = {
  username: string
};

export type AuthRes = {};

type M<T extends MessageType, D = any> = { type: T, data?: D };

export type Message =
  | M<MessageType.ParseError, undefined>
  | M<MessageType.EntityMap, Entity[]>
  | M<MessageType.AuthReq, AuthReq>
  | M<MessageType.AuthRes, AuthRes>
  | M<MessageType.Direction, Vec2>;

export type UID = number;

export type Connection = { uid: UID, socket: NodeWebSocket };
export type Raw = string; // TODO: needs to be ArrayBuffer
export type Chunk = WeakSet<Entity>;
