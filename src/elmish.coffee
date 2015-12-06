###
A UI component now consists of the following pure methods
init    : () -> state
update  : (state, action) -> state
view    : (dispatch, state, data) -> html
effect : (state) -> tree
###

R = require 'ramda'
flyd = require 'flyd'
flyd.lift = require 'flyd/module/lift'

ReactDOM = require('react-dom')
render = (x) -> ReactDOM.render(x, document.getElementById('root'))
html = require('react').DOM

start = ({init, view, update, effect}, handleEffect, monitor) ->
  action$ = flyd.stream()
  state$ = flyd.scan(update, init(), action$)
  effect$ = flyd.map(effect, state$)
  # handleEffect gets the effect output and returns a data
  # stream that gets piped back to the views
  data$ = handleEffect(effect$)
  html$ = flyd.lift(
    (state, data) -> view(action$, state, data)
    state$, data$
  )
  flyd.on(render, html$)
  monitor?({action$, state$, effect$, data$, html$})

module.exports = start