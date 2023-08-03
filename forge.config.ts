import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
// removed for __dirname issues in preload
// import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import webpack from "webpack";
import path from "path";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    icon: "resources/icon",
    extraResource: "resources/icon.ico",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    // new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            js: "./src/emptyPolyfill.ts",
            name: "empty_poly",
          },
          {
            html: "./src/index.html",
            js: "./src/renderer.tsx",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
              config: {
                module: {
                  rules: [
                    // {
                    //   // We're specifying native_modules in the test because the asset relocator loader generates a
                    //   // "fake" .node file which is really a cjs file.
                    //   test: /native_modules[/\\].+\.node$/,
                    //   use: "node-loader",
                    // },
                    // {
                    //   test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
                    //   parser: { amd: false },
                    //   use: {
                    //     loader: "@vercel/webpack-asset-relocator-loader",
                    //     options: {
                    //       outputAssetBase: "native_modules",
                    //     },
                    //   },
                    // },
                    {
                      test: /\.tsx?$/,
                      exclude: /(node_modules|\.webpack)/,
                      use: {
                        loader: "ts-loader",
                        options: {
                          transpileOnly: true,
                        },
                      },
                    },
                  ],
                },
                externals: {
                  electron: "commonjs electron",
                },
                plugins: [
                  new webpack.NormalModuleReplacementPlugin(
                    /^path$/,
                    path.resolve(
                      __dirname,
                      "./.webpack/renderer/empty_poly/index.js"
                    )
                  ),
                  new webpack.NormalModuleReplacementPlugin(
                    /^chokidar$/,
                    path.resolve(
                      __dirname,
                      "./.webpack/renderer/empty_poly/index.js"
                    )
                  ),
                  new webpack.NormalModuleReplacementPlugin(
                    /^fs-extra$/,
                    path.resolve(
                      __dirname,
                      "./.webpack/renderer/empty_poly/index.js"
                    )
                  ),
                  new webpack.NormalModuleReplacementPlugin(
                    /^node-fetch$/,
                    path.resolve(
                      __dirname,
                      "./.webpack/renderer/empty_poly/index.js"
                    )
                  ),
                  new webpack.NormalModuleReplacementPlugin(
                    /^obs-websocket-js$/,
                    path.resolve(
                      __dirname,
                      "./.webpack/renderer/empty_poly/index.js"
                    )
                  ),
                ],
                resolve: {
                  extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
                  fallback: {
                    assert: false,
                    buffer: false,
                    console: false,
                    constants: false,
                    crypto: false,
                    domain: false,
                    events: false,
                    fs: false,
                    http: false,
                    https: false,
                    os: false,
                    path: false,
                    punycode: false,
                    process: false,
                    querystring: false,
                    stream: false,
                    string_decoder: false,
                    sys: false,
                    timers: false,
                    tty: false,
                    url: false,
                    util: false,
                    vm: false,
                    zlib: false,
                  },
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
