html = require('react').DOM

fields = () ->
  ['name', 'image_url']

view = (user) ->
  html.div
    className: 'user-item'
    html.img
      className: 'image'
      src: user.image_url
    html.span
      className: 'name'
      user.name

module.exports = {view, fields}