import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
// removed for __dirname issues in preload
// import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    icon: 'resources/icon',
    extraResource: ['resources/icon.ico', 'resources/icon.icns'],
    protocols: [
      {
        name: 'LoL OBS Helper',
        schemes: ['lol-obs-helper'],
      },
    ],
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    // new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
              config: {
                module: {
                  rules: [
                    {
                      test: /\.tsx?$/,
                      exclude: /(node_modules|\.webpack)/,
                      use: {
                        loader: 'ts-loader',
                        options: {
                          transpileOnly: true,
                        },
                      },
                    },
                  ],
                },
                externals: {
                  electron: 'commonjs electron',
                },
                resolve: {
                  extensions: ['.ts'],
                },
              },
            },
          },
        ],
      },
    }),
  ],
};

export default config;
