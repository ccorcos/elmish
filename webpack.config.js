var webpack = require("webpack")
var path = require("path")
var root = __dirname
var nib = require("nib")

module.exports = {
  devtool: 'source-map',
  entry: {
    app: [
    'webpack-hot-middleware/client',
    'entry.coffee'
    ],
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
      '.svg',
      '.styl'
    ],
    modulesDirectories: [
      'node_modules'
    ],
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: "babel", exclude: /(node_modules|bower_components)/ },
      { test: /\.coffee$/, loader: "coffee" },
      { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader' },
      { test: /\.(svg|png|jpe?g|gif|ttf|woff2?|eot)$/, loader: 'url?limit=8182' }
    ]
  },
  stylus: {
    use: [nib()]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
}
