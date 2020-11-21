import { FOOD_SPAWN_CHANCE, SERVER_TPS  } from 'common';
import * as yargs from 'yargs';

export function parseArgs() {
  return yargs
    .option('chunksize', {
      alias: 'c',
      type: 'number',
      default: 256,
      desc: 'World chunk size'
    })
    .option('worldsize', {
      alias: 'w',
      type: 'number',
      default: 8,
      desc: 'World size in chunks (e.g. 8 * 256 = 2048 units size)',
    })
    .option('tps', {
      default: SERVER_TPS,
      type: 'number',
      description: 'Server ticks per second',
    })
    .option('foodchance', {
      default: FOOD_SPAWN_CHANCE,
      type: 'number',
      description: 'Chance for spawning food (in %)',
    })
    .strict()
    .help()
    .argv;
}

export type Args = ReturnType<typeof parseArgs>;
