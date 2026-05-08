import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as babel from '@babel/core';
import path from 'path';
import { readdirSync } from 'fs';

// @vitejs/plugin-react@6 dropped its `babel` option (JSX is now via oxc),
// so babel-plugin-react-compiler can't ride along the way it does in
// older setups. This minimal Vite plugin runs the compiler on user
// .ts(x)/.js(x) sources before plugin-react's JSX transform - babel
// parses with the typescript+jsx parser plugins (no preset, no syntax
// stripping), runs only the compiler, and emits source that plugin-react
// then JSX-transforms via oxc.
const reactCompilerPlugin = (): Plugin => ({
  name: 'react-compiler',
  enforce: 'pre',
  async transform(code, id) {
    if (id.includes('node_modules')) return null;
    if (!/\.[jt]sx?$/.test(id)) return null;
    if (!/\b[A-Z]|\buse/.test(code)) return null;
    const result = await babel.transformAsync(code, {
      filename: id,
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ['typescript', 'jsx'] },
      plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      sourceMaps: true,
    });
    if (!result?.code) return null;
    return { code: result.code, map: result.map };
  },
});

const absolutePathAliases: { [key: string]: string } = {};
// Root resources folder
const srcPath = path.resolve('./src');
const srcRootContent = readdirSync(srcPath, { withFileTypes: true }).map(dirent =>
  dirent.name.replace(/(\.ts|\.js)(x?)/, ''),
);

srcRootContent.forEach(directory => {
  absolutePathAliases[directory] = path.join(srcPath, directory);
});

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      ...absolutePathAliases,
    },
  },
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api', 'import'],
      },
    },
  },
});
