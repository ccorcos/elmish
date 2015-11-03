{start, render, flyd} = require './elmish'
http = require './http'

log = (label) -> (value) -> console.log(label+':', value)

renderToRoot = (html) ->
  render(html, document.getElementById('root'))

mount = ({html$, state$, action$, services:{http}}) ->
  flyd.map(renderToRoot, html$)
  flyd.map(log('state'), state$)
  flyd.map(log('action'), action$)
  flyd.map(log('http-action'), http.action$)
  flyd.map(log('http-pending'), http.pending$)

# ex1 - giphy
Giphy = require './giphy'
mount start(Giphy, {http})