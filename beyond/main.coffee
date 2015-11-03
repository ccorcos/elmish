{start, render, flyd} = require './elmish'
http = require './http'

log = (label) -> (value) -> console.log(label+':', value)

renderToRoot = (html) ->
  render(html, document.getElementById('root'))

# mount = ({html$, state$, action$, services:{http}}) ->
#   flyd.map(renderToRoot, html$)
#   flyd.map(log('state'), state$)
#   flyd.map(log('action'), action$)
#   flyd.map(log('http-action'), http.action$)
#   flyd.map(log('http-pending'), http.pending$)

mount = ({html$, state$, action$, services:{http}}) ->
  flyd.map(renderToRoot, html$)
  flyd.map(log('state'), state$)
  flyd.map(log('action'), action$)

# # ex1 - giphy with http
# Giphy = require './giphy'
# mount start(Giphy, {http})

# ex2 - counter again...
Counter = require './counter'
mount start Counter
