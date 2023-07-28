import type { ModuleOptions } from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

export const rules: Required<ModuleOptions>["rules"] = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: "node-loader",
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: "@vercel/webpack-asset-relocator-loader",
      options: {
        outputAssetBase: "native_modules",
      },
    },
  },
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
  // {
  //   test: /\.s?(a|c)ss$/,
  //   use: [
  //     MiniCssExtractPlugin.loader,
  //     "css-loader",
  //     {
  //       loader: "postcss-loader",
  //       options: {
  //         postcssOptions: {
  //           plugins: [require("tailwindcss"), require("autoprefixer")],
  //         },
  //       },
  //     },
  //   ],
  //   exclude: /\.module\.s?(c|a)ss$/,
  // },
];
