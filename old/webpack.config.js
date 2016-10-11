var webpack = require("webpack")
var path = require("path")
var root = __dirname

module.exports = {
  devtool: 'source-map',
  entry: {
    app: [
      'webpack-hot-middleware/client',
      'entry.js',
    ],
  },
  output: {
    path: root,
    filename: "bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel",
        // exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    root: root,
    alias: {
      elmish: root,
    }
  },
  babel: {
    presets: [
      'babel-preset-es2015',
      'babel-preset-react',
      'babel-preset-stage-0',
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
}
