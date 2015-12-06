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

# middleware is an object that maps keys to translations. the convention
# is for these keys to start with a $ to denote that they're special. 
# this means you can have your own high level api and translate that api 
# to actual arguments to window.fetch.
# the effect$ is a stream of fetch tree before being translated by the 
# middleware
http = (middleware, monitor) -> (effect$) ->

  # list of middlewares
  wares = R.keys(middleware)
  # check if an object is middleware
  isMiddleware = R.anyPass(R.map(R.has, wares))
  # determine which middleware an object is referencing
  whichMiddleware = (obj) -> R.find(R.has(R.__, obj), wares)
  # translate to window.fetch via middleware translation
  translateToFetch = (obj) -> middleware[whichMiddleware(obj)](obj)
  # translate all the leaves of the fetch tree through the middleware
  translateLeaves = evolveLeavesWhere(isMiddleware, translateToFetch)
  # wrap the fetch tree into an action with type: fetch
  wrapAction = R.assoc('tree', R.__, {type:'fetch'})
  # translate effect$ to fetch$
  toFetch = R.pipe(
    translateLeaves, 
    wrapAction
  )

  # fetch action
  fetch$ = flyd.map(toFetch, effect$)
  # http responses
  response$ = flyd.stream()
  # action stream
  action$ = flyd.merge(fetch$, response$)

  ###
  the http state keeps track of all pending requests, caches
  requests, and deduplicates requests. the tree is a template
  for the data required by the app. leaves should have objects
  of the format {$fetch: {name, args: [url, options]}}. url and
  options are direct arguments to window.fetch. [url, options]
  are serialized and used as a key for the cache.
  we remember the previous requests so we can do a diff, clear
  the cache of any stale requests, and send side-effects to fetch
  any new requests. the request will respond with a response action
  that has a key and a value for to add to the cache.
  we remember the previous tree in the state so we can rebuild the
  new data object when responses come in. we also "save" the data
  object in the state so we can map over the state and pull it out
  into its own stream.

  state  : {requests, cache, data, tree}
  action : {type: 'fetch', tree}
         : {type: 'response', key, value}

  tree leaves : {$fetch: {name, args: [url, options]}}
  ###
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
          
        # send off any new requests responding with the
        # {name: result} or {error}
        newRequests.map ({args, name}) ->
          window.fetch.apply(window, args)
            .then (response) -> response.json()
            .then (result) -> {"#{name}": result}
            .catch (error) -> {error}
            .then (result) ->
              response$
                type: 'response'
                key: serialize(args)
                value: result
        # populate the tree with data from the cache
        data = makeData(nextCache, action.tree)
        # remember the requests for next time around
        # remember the data so we can filter it out
        # remember the tree so we can repopulate after responses
        return {
          requests: nextRequests
          cache: nextCache
          data: data
          tree: action.tree
        }

      when 'response'
        # assign the cache with a new value
        nextCache = R.assoc(action.key, action.value, state.cache)
        # populate data from the new cache
        nextData = makeData(nextCache, state.tree)
        return {
          requests: state.requests
          data: nextData
          cache: nextCache
          tree: state.tree
        }
      else
        return state


  emptyState = {requests:[], cache:{}, data:{}, tree:{}}
  # initialize the http state
  init = update(emptyState, fetch$())
  # scan over the action$
  http$ = flyd.scan(update, init, action$)
  # get the data out
  data$ = flyd.map(R.prop('data'), http$)
  # monitor streams
  monitor?({effect$, response$, http$, action$, data$})
  return data$

module.exports = http