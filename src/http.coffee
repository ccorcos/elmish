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

# get the keys for the requests
serializeRequests = R.map(R.pipe(R.prop('args'), serialize))

init = ->
  requests: []
  cache: {}
  effects: {}
  send: []

update = (state, action) ->
  switch action.type
    when 'effects'
      # diff the previous requests with the next requests
      prevRequests = state.requests
      nextRequests = findAllRequests(action.effects)
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

      send: newRequests
      requests: nextRequests
      cache: nextCache
      effects: action.effects

    when 'response'
      R.evolve({
        cache: R.assoc(action.key, action.value)
        send: R.always([])
      }, state)
     
data = (dispatch, state) ->
  # send off any new requests responding with the
  # {name: result} or {error}
  state.send.map ({args, name}) ->
    window.fetch.apply(window, args)
      .then (response) -> response.json()
      .then (result) -> {"#{name}": result}
      .catch (error) -> {error}
      .then (result) ->
        dispatch
          type: 'response'
          key: serialize(args)
          value: result

  evolveLeavesWhere(
    R.has('$fetch'),
    (req) ->
      key = serialize(R.path(['$fetch', 'args'], req))
      return state.cache[key]
    state.effects
  )

wrap = (effects) ->
  {effects, type: 'effects'}


module.exports = {init, update, data, wrap}