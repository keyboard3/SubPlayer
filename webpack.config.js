const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  mode: "development",
  entry: {
    app: "./src/index.tsx"
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/sub-player/',
    clean: true
  },
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  devtool: 'source-map',
  resolve: {
    fallback: {
      "@ffmpeg/ffmpeg": false
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: 'ts-loader?transpileOnly=true'
      },
      {
        test: /\.css$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|mp3|mp4)$/,
        type: 'asset/resource',
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      React: 'react',
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),
    new CopyPlugin({
      patterns: [
        { from: "public", to: "." },
      ],
    }),
  ],
}