R = require 'ramda'
flyd = require 'flyd'

ReactDOM = require('react-dom')
render = (x) -> ReactDOM.render(x, document.getElementById('root'))
html = require('react').DOM

###
init    : () -> state
update  : (state, action) -> state
view    : (dispatch, state) -> html
###

simple = ({init, view, update}) ->
  action$ = flyd.stream()
  state$ = flyd.scan(update, init(), action$)
  html$ = flyd.map(R.curry(view)(action$), state$)
  flyd.on(render, html$)

###
ui.init    : () -> state
ui.update  : (state, action) -> state
ui.view    : (dispatch, state, data) -> html

ui.effects : (state) -> effects
api        : (effects) -> fxEffects
fx.wrap    : (fxEffects) -> action

fx.init    : () -> state
fx.update  : (state, action) -> state
fx.data    : (dispatch, state) -> data
###

simplify = (app, fx, api) ->

  init = ->
    state = {}
    state.app = app.init()
    state.fx = fx.update(fx.init(), fx.wrap(api(app.effects(state.app))))
    return state

  update = (state, action) ->
    console.log(action, state)
    switch action.type
      when 'app'
        next = {}
        next.app = app.update(state.app, action.action)
        next.fx = fx.update(state.fx, fx.wrap(api(app.effects(next.app))))
        return next
      when 'fx'
        next = {}
        next.app = state.app
        next.fx = fx.update(state.fx, action.action)
        return next
      else
        console.warn(action)
        return state

  view = (dispatch, state) ->
    respond = R.pipe(R.assoc('action', R.__, {type:'fx'}), dispatch)
    act = R.pipe(R.assoc('action', R.__, {type:'app'}), dispatch)
    data = fx.data(respond, state.fx)
    console.log(state, data)
    app.view(act, state.app, data)

  {init, update, view}

start = (app, fx, api) ->
  simple(simplify(app, fx, api))

module.exports = start
