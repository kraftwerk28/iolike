import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import { Server as WsServer } from 'ws';

import { log } from './logger';
import { GameState } from './game';
import { parseArgs } from './args';

async function main() {
  const args = parseArgs()
  const gameState = new GameState(args);
  const port = process.env.PORT || 8080;
  const publicPath = process.env.PUBLIC || 'public';

  const app = fastify();
  app.register(fastifyStatic, { root: path.resolve(__dirname, publicPath) });
  const wsServer = new WsServer({ server: app.server });

  wsServer
    .on('connection', (socket) => gameState.onNewConnection(socket))
    .on('error', (err) => log.error('WS error', err));

  app.listen(port).then(() => {
    log.info('server listening %s', `http://localhost:${port}`);
  });

  gameState.run();
}

main().catch((err) => {
  log.error(err);
});
