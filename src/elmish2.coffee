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

start = ({init, view, update, effect}, handleEffect) ->
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
  # monitor?({action$, state$, effect$, data$, html$})


simple = ({init, view, update}) ->
  action$ = flyd.stream()
  state$ = flyd.scan(update, init(), action$)
  html$ = flyd.map(R.curry(view)(action$), state$)
  flyd.on(render, html$)
  # monitor?({action$, state$, effect$, data$, html$})



module.exports = start




startfx = (app, fx) ->
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
  # monitor?({action$, state$, effect$, data$, html$})








# hold both http and app state. 
# throw the http side-effect in the "view"

###
ui.init    : () -> state
ui.update  : (state, action) -> state
ui.view    : (dispatch, state, data) -> html
ui.effects : (state) -> effects

fx.init    : () -> state
fx.wrap    : (effects) -> action
fx.update  : (dispatch, state, action) -> state
fx.data    : (state) -> data
###

start = (app, fx) ->
  response$ = flyd.stream()
  dispatch$ = flyd.stream()

  action$ = flyd.merge(
    flyd.map(
      (action) -> {type: 'app', action}
      dispatch$
    )
    flyd.map(
      (action) -> {type: 'fx', action}
      response$
    )
  )

  init = ->
    state = {}
    state.app = app.init()
    state.fx = fx.update(response$, fx.init(), fx.wrap(app.effects(state.app)))
    return state

  view = (state) ->
    app.view(dispatch$, state.app, fx.data(state.fx))

  update = (state, action) ->
    switch type
      when 'app'
        next = {}
        next.app = app.update(state.app, action.action)
        next.fx = fx.update(response$, state.fx, fx.wrap(app.effects(state.app)))
        return next
      when 'fx'
        next = {}
        next.app = state.app
        next.fx = fx.update(response$, state.fx, action.action)
        return next
    else
      console.warn(action)
      return state

  state$ = flyd.scan(update, init(), action$)
  html$ = flyd.map(view, state$)
  flyd.on(render, html$)







