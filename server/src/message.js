import assert from 'assert';
import cp from 'child_process';
import * as readline from 'readline';
import { Server as WsServer } from 'ws';
import log from './logger';

import {
  xy2ab, isValidAB, isValidColor, ab2xy,
  PASS, CHAN_TYPE, MSG_TYPE, COLOR,
} from '../common';

/**
 * @typedef {{ type: MSG_TYPE, payload: any }} Message
 */

/** @type {WsServer} */
let wsServer;

/** Waitgroup counters for queueing connections */
let connQueueIndex = 0;
let connQueueHead = connQueueIndex;
let botCounter = 1;

export async function createChan(...args) {
  const chan = new MsgChan(...args);
  await chan.waitConnected();
  return chan;
}

class MsgChan {
  constructor(type, params) {
    this.type = type;
    this._connected = false;
    this._waitConnectedResolves = new Set();

    this._awaitMessageResolves = [];
    this._messageQueue = [];

    const processMessage = this._acceptMessage.bind(this);
    if (type === CHAN_TYPE.CMD) {
      log.i(`Launching bot: "${params.cmd}".`);
      assert.ok(params.cmd, 'Command must be present');
      this.botLabel = botCounter++;

      const proc = cp.exec(params.cmd);

      proc.stderr.on('data', (chunk) => {
        log.i(`Bot${this.botLabel} [stderr]: ${chunk}`);
      });
      const onExitHandler = (code) => {
        this._connected = false;
        log.i(`Bot${this.botLabel} terminated with exit code ${code}.`);
      }
      proc.on('close', onExitHandler);
      proc.on('disconnect', onExitHandler);

      const rl = readline.createInterface({
        input: proc.stdout,
        output: proc.stdin,
        terminal: false,
      });
      // const rl = readline.createInterface(proc.stdout);
      rl.on('line', processMessage);

      this._connected = true;
      this.proc = proc;
      this.rl = rl;

    } else if (type === CHAN_TYPE.WS) {
      log.i(`Opening websocket.`);
      if (!wsServer) {
        assert.ok(params.server, 'Server must be specified');
        wsServer = new WsServer({ server: params.server });
      }

      const wgIndex = connQueueIndex++;
      const onConnect = (conn) => {
        if (wgIndex !== connQueueHead) {
          return;
        }
        setImmediate(() => { connQueueHead++ });
        this.conn = conn;
        conn.on('message', processMessage);
        conn.on('close', () => {
          this._connected = false;
        });
        this._waitConnectedResolves.forEach((resolve) => { resolve(this) });
        this._connected = true;
        this._waitConnectedResolves.clear();
        wsServer.off('connection', onConnect);
      };
      wsServer.on('connection', onConnect);
    }
  }

  _acceptMessage(raw) {
    if (this.type === CHAN_TYPE.CMD) {
      log.i(`Bot${this.botLabel} [stdout] > ${raw}`);
    }
    const parsed = this._decode(raw);

    this._messageQueue.push(parsed);
    this._flushMQ();
  }

  _flushMQ() {
    while (this._awaitMessageResolves.length && this._messageQueue.length) {
      const resolve = this._awaitMessageResolves.shift();
      const message = this._messageQueue.shift();
      resolve(message);
    }
  }

  /**
   * @returns {Promise<Message>}
   */
  recv() {
    return new Promise((resolve) => {
      this._awaitMessageResolves.push(resolve);
      this._flushMQ();
    });
  }

  async send(message) {
    const { type, payload } = message;
    const raw = this._encode(type, payload);

    if (!this._connected) {
      return;
    }
    if (this.type === CHAN_TYPE.CMD) {
      this.proc.stdin.write(raw + '\n');
    } else if (this.type === CHAN_TYPE.WS) {
      return new Promise((resolve) => {
        this.conn.send(raw, undefined, () => resolve());
      });
    }
  }

  waitConnected() {
    if (this._connected) {
      return Promise.resolve(this);
    }
    return new Promise((resolve) => {
      this._waitConnectedResolves.add(resolve);
    });
  }

  _decode(raw) {
    if (this.type === CHAN_TYPE.WS) {
      try {
        const [type, payload] = JSON.parse(raw);
        if (Object.values(MSG_TYPE).includes(type)) {
          return { type, payload };
        }
        throw new Error;
      } catch (err) {
        log.e('Failed to parse message:', err);
        return { type: MSG_TYPE.ERR };
      }
    } else if (this.type === CHAN_TYPE.CMD) {
      if (isValidAB(raw)) {
        return { type: MSG_TYPE.COORD, payload: ab2xy(raw) };
      } else if (isValidColor(raw)) {
        return { type: MSG_TYPE.COLOR, payload: COLOR[raw] };
      } else if (raw === 'pass') {
        return { type: MSG_TYPE.PASS };
      } else {
        return { type: MSG_TYPE.ERR };
      }
    }
  }

  _encode(type, payload) {
    if (this.type === CHAN_TYPE.WS) {
      return JSON.stringify([type, payload]);
    } else if (this.type === CHAN_TYPE.CMD) {
      switch (type) {
        case MSG_TYPE.COORD:
          return xy2ab(payload);
        case MSG_TYPE.PASS:
          return 'pass';
        case MSG_TYPE.COLOR:
          return payload === COLOR.black ? 'black' : 'white';
        default:
          return;
      }
    }
  }
}
