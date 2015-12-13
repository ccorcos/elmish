var webpack = require("webpack")
var path = require("path")
var root = __dirname
var nib = require("nib")

module.exports = {
  devtool: 'source-map',
  entry: {
    app: [
    'webpack-hot-middleware/client',
    'entry.js'
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
      '.jsx',
      '.coffee',
      '.styl',
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
      { test: /\.jsx?$/, loader: "babel", exclude: /(node_modules)/, query: { presets: ['es2015', 'react'], "plugins": ["syntax-object-rest-spread"] } },
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
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ]
}
