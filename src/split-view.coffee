html = require('react').DOM

require 'src/split-view.styl'

view = ({sidebar, content}) ->
  html.div
    className: 'split-view'
    html.div
      className: 'sidebar'
      sidebar
    html.div
      className: 'content'
      content

module.exports = view