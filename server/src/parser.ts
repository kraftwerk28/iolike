import { Message, MessageType } from 'common/types';
import { Data } from 'ws';

export function parse(raw: Data): Message {
  try {
    if (typeof raw !== 'string') {
      throw new Error;
    }
    const { type, data } = JSON.parse(raw);
  } catch {
    return { type: MessageType.ParseError };
  }
}

export function serialize(type: MessageType, data) {

}
