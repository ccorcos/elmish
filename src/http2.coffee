# polyfills
require('whatwg-fetch')
require('es6-promise').polyfill()

R = require 'ramda'
flyd = require 'flyd'

{
  evolveLeavesWhere
  leavesWhere
  vennDiagram
} = require 'src/utils.coffee'

serialize = (obj) -> JSON.stringify(obj)
deserialize = (obj) -> JSON.parse(obj)

# parse through the fetch tree for specific objects with the $fetch.
# Each object should have a format like this:
# {$fetch: {name, args: [url, options]}}
findAllRequests = R.pipe(
  leavesWhere(R.has('$fetch'))
  R.map(R.prop('$fetch'))
)

# take a tree and populate it from the cache
makeData = (cache, tree) ->
  evolveLeavesWhere(
    R.has('$fetch'),
    (req) ->
      key = serialize(R.path(['$fetch', 'args'], req))
      return cache[key]
    tree
  )

# get the keys for the requests
serializeRequests = R.map(R.pipe(R.prop('args'), serialize))

init = ->
  {requests:[], newRequests: [] cache:{}}

fetch = (response$, state) ->
  # send off any new requests responding with the
  # {name: result} or {error}
  state.newRequests.map ({args, name}) ->
    window.fetch.apply(window, args)
      .then (response) -> response.json()
      .then (result) -> {"#{name}": result}
      .catch (error) -> {error}
      .then (result) ->
        response$
          type: 'response'
          key: serialize(args)
          value: result

data = (state) ->
  # populate the tree with data from the cache
  makeData(state.cache, state.tree)

update = (state, action) ->
  switch action.type
    when 'fetch'
      # diff the previous requests with the next requests
      prevRequests = state.requests
      nextRequests = findAllRequests(action.tree)
      [newRequests, sameRequests, oldRequests] = vennDiagram(nextRequests, prevRequests)
      # cleanup the cache of the old requests
      oldKeys = serializeRequests(oldRequests)
      nextCache = R.omit(oldKeys, state.cache) 
      # set a pending state for the new requests in the cache
      newRequests.map ({args, name}) ->
        key = serialize(args)
        nextCache[key] =
          "#{name}":
            $pending: true, 
            $startedAt: Date.now()
        
      return {
        requests: nextRequests
        newRequests: newRequests
        cache: nextCache
        tree: action.tree
      }

    when 'response'
      # assign the cache with a new value
      nextCache = R.assoc(action.key, action.value, state.cache)
      return {
        requests: state.requests
        newRequests: state.newRequests
        cache: nextCache
        tree: action.tree
      }
    else
      return state




start = (ui, fx) ->

  ui.action$ = flyd.stream()
  ui.state$ = flyd.scan(ui.update, ui.init(), ui.action$)
  ui.effect$ = flyd.map(ui.effect, ui.state$)

  fx.fetch$ = flyd.map(middleware, ui.effect$)

  fx.response$ = flyd.stream()
  fx.action$ = flyd.merge(fx.fetch$, fx.response$)
  fx.state$ = flyd.scan(fx.update, fx.init(), fx.action$)
  fx.data$ = flyd.map(fx.data, fx.state$)


  flyd.on(R.curry(fx.fetch)(fx.response$), fx.state$)

  ui.html$ = flyd.lift(
    (state, data) -> ui.view(ui.action$, state, data)
    ui.state$, fx.data$
  )
  flyd.on(render, ui.html$)
  # monitor?({action$, state$, effect$, data$, html$})


ui = {init, update, view, effect}
effect = R.map(translateMiddleware, ui.effect)


fx = {init, update, fetch, data}


update = ({state, data}, action) ->
view = (dispatch, {state, data})


debug = (ui, fx) ->
  time$ = flyd.stream(0)

  init = ->
    states: [ui.init()]
    time: 0

  update = (state, action) ->
    switch action.type
      when 'change_time'
        states: state.states
        time: action.time
      when 'child_action'
        child = ui.update(state.states[time], action.action)
        states = state.states[0...time].concat(child)
        states: states
        time: state.time + 1

  view = (dispatch, state, data) ->
    handleDispatch = (action) ->
      if state.get('future').count() is 0
        dispatch({type: 'child_action', action})

    html.div
      className: 'debug'
      html.div
        className: 'app'
        ui.view(handleDispatch, state.get('now'), data)
      html.div
        className: 'panel'
        html.input
          type: 'range'
          className: 'slider'
          min: 0
          max: state.get('past').count() + state.get('future').count()
          onChange: -> time$({type: 'change_time'})
        html.label
          className: 'time'
          state.get('past').count()

  ui.action$ = flyd.stream()
  # flyd.merge(ui.action$, time$)
  ui.state$ = flyd.scan(ui.update, ui.init(), ui.action$)
  ui.effect$ = flyd.map(ui.effect, ui.state$)

  fx.fetch$ = flyd.map(middleware, ui.effect$)

  fx.response$ = flyd.stream()
  fx.action$ = flyd.merge(fx.fetch$, fx.response$)
  update = (state, action) ->



  fx.state$ = flyd.scan(fx.update, fx.init(), fx.action$)
  fx.data$ = flyd.map(fx.data, fx.state$)


  flyd.on(R.curry(fx.fetch)(fx.response$), fx.state$)

  ui.html$ = flyd.lift(
    (state, data) -> ui.view(ui.action$, state, data)
    ui.state$, fx.data$
  )
  flyd.on(render, ui.html$)
  # monitor?({action$, state$, effect$, data$, html$})
