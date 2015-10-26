var path = require("path")
var root = __dirname

module.exports = {
  entry: {
    app: 'entry.coffee',
  },
  output: {
    path: root,
    filename: "bundle.js",
  },
  resolve: {
    root: [
      root
    ],
    extensions: [
      '',
      '.js',
      '.coffee',
      '.scss',
      '.png',
      '.jpg',
      '.svg'
    ],
    modulesDirectories: [
      'node_modules'
    ],
  },
  module: {
    loaders: [
      {
        test: /\.coffee$/,
        loader: 'coffee',
      }
    ]
  }
}
