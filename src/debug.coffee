R = require 'ramda'
html = require('react').DOM
{Map, List} = require('immutable')

###
app.init     : () -> state
app.update   : (state, action) -> state
app.view     : (dispatch) -> (state, data) -> html
app.effect   : (state) -> tree

http.init    : () -> state
http:update  : (state, action) -> state
http:fetch   : (dispatch) -> (state, effects) -> state
http:data    : (state) -> data

debug.init   : () -> state
debug.update : (state, action) -> state
debug.view   : (dispatch) -> (state) -> state

TODO
- http needs to keep track of pending so we can cancel and restart
  when we pause and play time. it cant be imperative though. 

###

debug = (app, http) ->

  # a list of app and http states
  init = ->
    state = {}
    state.app = app.init()
    state.effects = app.effect(state.app)
    state.http = http.fetch(http.init(), state.effects)
    {time: 0, list:[state], paused: false}

  update = (dispatch) -> (state, action) ->
    switch action.type
      when 'play'
        R.assoc('paused', false, state)
      when 'pause'
        R.assoc('paused', true, state)
      when 'change_time'
        R.evolve({time: R.inc}, state)
      when 'app_action'
        if state.paused
          state
        else
          next = {}
          next.app = app.update(state.list[state.time].app, action.action)
          next.effects = app.effect(next.app)
          next.http = http.fetch(
            R.pipe(
              R.assoc('http_action', R.__, {}), 
              dispatch
            )
            state.http, next.effects
          )
          if state.list.length - 1 is state.time
            R.evolve({
              time: R.inc
              list: R.append(next)
            }, state)
          else
            R.evolve({
              time: R.inc
              list: R.pipe( R.take(state.time), R.append(next))
            }, state)
      when 'http_action'
        if state.paused
          state
        else
          next = {}
          next.app = state.app
          next.effects = state.effects
          next.http = http.update(state.http, action.action)
          if state.list.length - 1 is state.time
            R.evolve({
              time: R.inc
              list: R.append(next)
            }, state)
          else
            R.evolve({
              time: R.inc
              list: R.pipe( R.take(state.time), R.append(next))
            }, state)
      else
        state

  view = (dispatch, state) ->
    child = state.list[state.time]
    html.div
      className: 'debug'
      html.div
        className: 'app'
        app.view(
          R.pipe(
            R.assoc('app_action', R.__, {}), 
            dispatch
          )
          child.state
          child.data
        )
      html.div
        className: 'panel'
        html.input
          type: 'range'
          className: 'slider'
          min: 0
          max: state.list.length
          onChange: -> dispatch {type: 'change_time'}
        html.label
          className: 'time'
          state.time


  action$ = flyd.stream()
  state$ = flyd.scan(update(action$), init(), action$)
  html$ = flyd.map(R.curry(view)(action$), state$)
  flyd.on(render, html$)







  debug.action$ = flyd.stream() # pause/play, set time

  # app.action$ = flyd.stream()
  # app.state$ = flyd.scan(app.update, app.init(), app.action$)
  # app.effect$ = flyd.map(app.effect, app.state$)
  


  # handleEffect gets the effect output and returns a data
  # stream that gets piped back to the views
  app.data$ = handleEffect(app.effect$)

  debug.state$ = flyd.scan(
    debug.update
    debug.init(app.init())
    debug.action$
  )


  # this is the app state
  app$ = flyd.lift(
    (state, data) -> {state, data}
    state$, data$
  )

  # pipe the app state to debug as a new state
  # block actions if paused
  # 




  appAction$ = flyd.map(
    ({state, data}) -> {type:'app', state, data}
    app$
  )

  flyd.merge(debug.action$, appAction$)

  debug.view(childView, dispatchDebug, dispatchApp, state)




  # debug view picks the right 


  both$ = flyd.lift(
    (state, data) -> {state, data}
    state$, data$
  )




  flyd.map(debug.update, time$)


  html$ = flyd.lift(
    (state, data) -> view(action$, state, data)
    state$, data$
  )
  flyd.on(render, html$)
  # monitor?({action$, state$, effect$, data$, html$})


























































###
- time travel slider
- undoable component
- search component
- http caching

the only right way to do this is if http had time travel built into it.


actions
- CHANGE_TIME


###



debug = ({init, view, update}) ->
  # remember update 
  # for ui, this is the state
  # for http, this is the data
  









debug = (child, handleEffect) ->
  # child : {init, effect, update, view}


  handle = (effect$) ->



  view = (dispatch, state, data) ->

    handleDispatch = (action) ->
      if state.get('future').count() is 0
        dispatch({type: 'child', action})

    html.div
      className: 'debug'
      html.div
        className: 'app'
        child.view(handleDispatch, state.get('now'), data)
      html.div
        className: 'panel'
        html.input
          type: 'range'
          className: 'slider'
          min: 0
          max: state.get('past').count() + state.get('future').count()
          onChange: -> dispatch {type: 'CHANGE_TIME'}
        html.label
          className: 'time'
          state.get('past').count()

  update = (state, action) ->




  init = () ->
    Map
      past: List()
      now: child.init()
      future: List()

  effect = (state) ->
    cond state.live, 
      ->
        users: followingList.effect()
        stars: starList.effect(state.selected)
      ->
        users: followingList.effect()

# update = (state, action) ->
#   switch action.type
#     when "select_user"
#       return R.assoc('selected', action.id, state)
#     else
#       return state

# view = (dispatch, state, data) ->
#   splitView
#     sidebar: followingList.view
#       selected: state.selected
#       select: (id) -> dispatch({type: 'select_user', id})
#       data: data.users
#     content: cond state.selected,
#       ->
#         starList.view(data.stars)
#       ->
#         html.div
#           className: 'nothing'
#           'Please select a user from the list on the left.'


# module.exports = {init, effect, update, view}