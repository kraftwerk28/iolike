import { builtinModules } from 'module';
import cp from 'child_process';
import path from 'path';
import preprocess from 'svelte-preprocess';
import svelte from 'rollup-plugin-svelte';
import ts from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';

import pkg from './package.json';

const isDev = process.env.NODE_ENV === 'development';
const outputPath = path.resolve(__dirname, 'build/');

const serverArgs = [];

function runServer() {
  let serverProc;
  function writeBundle() {
    if (serverProc) {
      serverProc.kill('SIGTERM');
      console.info('Killed outdated server.');
    }
    serverProc = cp.spawn(
      'node',
      ['--enable-source-maps', path.join(outputPath, 'index.js'), ...serverArgs],
      { stdio: ['ignore', 'inherit', 'inherit'], shell: true },
    );
  }
  return { writeBundle };
}

const client = {
  input: 'client/src/index.ts',
  output: {
    sourcemap: isDev,
    dir: path.join(outputPath, 'public/'),
    format: 'iife',
  },
  plugins: [
    svelte({
      dev: isDev,
      css: (css) => {
        css.write('bundle.css');
      },
      preprocess: preprocess(),
    }),
    ts({ tsconfig: 'client/tsconfig.json' }),
    resolve({ browser: true, dedupe: ['svelte'] }),
    // commonjs(),
    isDev && livereload('public/'),
    // !isDev && terser(),
    copy({
      targets: [
        { src: 'app/public/*', dest: path.resolve(outputPath, 'public/') },
      ],
    }),
  ],
  watch: { clearScreen: false },
};

const server = {
  input: 'server/src/index.ts',
  output: {
    sourcemap: isDev,
    file: path.resolve(outputPath, 'index.js'),
    format: 'cjs',
  },
  plugins: [
    ts({ tsconfig: 'server/tsconfig.json' }),
    resolve({ browser: false }),
    cjs(),
    isDev && runServer(),
    json(),
  ],
  external: builtinModules.concat(Object.keys(pkg.dependencies)),
  watch: { clearScreen: false },
};

export default [client, server];
