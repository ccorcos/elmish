/*

The canonical component type signature:

init :: * -> state
update :: action -> state -> state
publish :: dispatch -> state -> pub
effect :: dispatch -> state -> pub -> ... -> *
component :: {init, update, publish, effect...}

Effects can have extra arguments, denoted ..., but its optional. You can have
many effects with various names.

Transforms take a component and transform it into another shape ending in
the canonical format.

transform :: component' -> component

elmish takes a list of key-value services which map to the name of the effect
function name on the component.

driver :: stream -> SIDE-EFFECT!!
service :: {driver, ...}

elmish :: {name: service} -> {creator, start}
creator :: [transform] -> component' -> component
start :: component -> SIDE-EFFECT!!





TODO:
- think harder about middleware and refactoring so theres less boilerplate
- there needs to be some default lifting functionality
- lift middleware to handle static components
- lift middleware for dynamic components

- create a console logger service
- create a hotkeys service

- performance and laziness middleware
- how to handle lazy trees in services

- extrapolate into a modal window
- create a hotkeys driver as an example
- register services with elmish with static type interence?
- create a dynamic listOf component
- create an app that doesnt even render!
- synchronous services?
- service translators as higher order components? (graphql, caching, etc.)

*/

import flyd from 'flyd'
import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'

const log = x => y => console.log(x, y)

const elmish = (services) => ({
  creator: (transforms) => (component) => {
    return transforms.reduce((x, tx) => tx(x), component)
  },
  start: (app) => {
    const action$ = flyd.stream()
    flyd.map(log('action'), action$)
    const state$ = flyd.scan(app.update, app.init(), action$)
    // no we'll connect to each service
    const stateAndPub$ = flyd.map(state => {
      return {
        state,
        pub: app.publish(state, action$)
      }
    }, state$)
    flyd.map(log('state + pub'), stateAndPub$)
    Object.keys(services).map(name => {
      const declare$ = flyd.map(({state, pub}) => {
        return R.curry(app[name])(state, action$, pub)
      }, stateAndPub$)
      // RUN SIDE-EFFECTS!!!
      services[name].driver(declare$)
    })
  }
})

const root = document.getElementById('root')

const services = {
  view: {
    driver: (view$) => {
      flyd.on(view => ReactDOM.render(view, root), view$)
    },
  },
}

// middleware:
// - update routing
// - action creator
// - lazy react components
// - static lift


const {creator, start} = elmish(services)
const create = creator([])

const counter = create({
  init: () => {
    return { count: 0 }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'increment':
        return { count: state.count + 1 }
      case 'decrement':
        return { count: state.count - 1 }
      default:
        throw TypeError('Unknown action', action)
    }
  },
  view: (state, dispatch) => {
    const inc = () => dispatch({ type: 'increment' })
    const dec = () => dispatch({ type: 'decrement' })
    return h('div.counter', [
      h('button.dec', {onClick: dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: inc}, '+')
    ])
  },
})

// could use creator middleware for this as well!
const forward = (dispatch, type) => (action) => dispatch({type, action})

const counters = create({
  init: () => {
    return {
      height: counter.init(),
      weight: counter.init(),
    }
  },
  // publish stats so other components can access this data
  // in a formatted manner. its really just a different view of state thats
  // more global. that way you can change your component heirarchy and state
  // structure without losing the publish/subscribe links
  publish: (state, dispatch) => {
    // we dont care to publish any of the counter publications. in this way
    // we're able to scope publications. We could even filter publications
    // and restructure if we wanted to. we could also publish something like
    // a modal view as well!
    return {
      stats: {
        height: state.height.count,
        weight: state.weight.count,
      }
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'height':
        return R.evolve({
          height: R.curry(counter.update)(R.__, action.action)
        }, state)
      case 'weight':
        return R.evolve({
          weight: R.curry(counter.update)(R.__, action.action)
        }, state)
      default:
        throw TypeError('Unknown action', action)
    }
  },
  view: (state, dispatch, pub) => {
    return h('div.counters', [
      h('div.height', [
        counter.view(state.height, forward(dispatch, 'height'))
      ]),
      h('div.weight', [
        counter.view(state.weight, forward(dispatch, 'weight'))
      ]),
    ])
  }
})

const bmi = create({
  init: () => {},
  update: (s,a) => {},
  view: (state, dispatch, pub) => {
    return h('span.bmi', [
      'BMI:', pub.stats.height * pub.stats.weight
    ])
  }
})

const app = create({
  init: () => {
    return {
      counters: counters.init(),
    }
  },
  publish: (state, dispatch) => {
    return counters.publish(state.counters, forward(dispatch, 'counters'))
  },
  update: (state, action) => {
    switch (action.type) {
      case 'counters':
        return R.evolve({
          counters: R.curry(counters.update)(R.__, action.action)
        }, state)
      default:
        throw TypeError('Unknown action', action)
    }
  },
  view: (state, dispatch, pub) => {
    return h('div.app', [
      counters.view(state.counters, forward(dispatch, 'counters'), pub),
      bmi.view(null, null, pub),
    ])
  }
})

// turn everything on!
start(app)