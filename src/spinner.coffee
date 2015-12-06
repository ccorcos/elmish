html = require('react').DOM

require 'src/spinner.styl'

view = ->
  html.div
    className: 'pong-loader'
    'loading...'

module.exports = view