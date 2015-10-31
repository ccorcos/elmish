{start, render, flyd} = require './elmish'
http = require './http'

log = (label) -> (value) -> console.log(label+':', value)
streamLogger = (label) -> 
  s = flyd.stream()
  flyd.map ->
    console.log label, s()
  , s
  return s

logHttp = ({action$, pending$}) ->
  flyd.map(log('http-action'), action$)
  flyd.map(log('http-pending'), pending$)
  
logHttp(http)

renderToRoot = (html) ->
  render(html, document.getElementById('root'))

mount = ({html$, state$, action$}) ->
  flyd.map(renderToRoot, html$)
  flyd.map(log('state'), state$)
  flyd.map(log('action'), action$)
  
# ex1 - giphy
Giphy = require './giphy'
mount start(Giphy, {http})