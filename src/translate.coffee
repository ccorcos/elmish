R = require 'ramda'
flyd = require 'flyd'

{
  evolveLeavesWhere
} = require 'src/utils.coffee'

# translate effect$ to fetch$ via middleware

# middleware is an object that maps keys to translations. the convention
# is for these keys to start with a $ to denote that they're special. 
# this means you can have your own high level api and translate that api 
# to actual arguments to window.fetch.
# the effect$ is a stream of fetch tree before being translated by the 
# middleware

translate = (middleware) -> (effect$) ->
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
  return fetch$

module.exports = translate