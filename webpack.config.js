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
      { test: /\.js$/, loader: "babel", exclude: /(node_modules|bower_components)/ },
      { test: /\.coffee$/, loader: "babel!coffee" },
      { test: /\.(svg|png|jpe?g|gif|ttf|woff2?|eot)$/, loader: 'url?limit=8182' }
    ]
  }
}
