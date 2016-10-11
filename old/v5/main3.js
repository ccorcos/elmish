/*

Using creator / transforms pattern for routing and actions. This is just
shorthand helpers / middleware effectively.


the other stuff was getting way to distracting...
The plan:

- create a counter that renders
- use two sibling counters to create a BMI calculator using state subscriptions
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
    // do any lifting in regards to services
    // then pipe through the transforms
    return transforms.reduce((x, tx) => tx(x), component)
  },
  start: (app) => {
    const action$ = flyd.stream()
    flyd.map(log('action'), action$)
    const state$ = flyd.scan(app.update, app.init(), action$)
    flyd.map(log('state'), state$)
    // no we'll connect to each service
    Object.keys(services).map(name => {
      const declare$ = flyd.map(R.curry(app[name])(R.__, action$), state$)
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

const routeTransform = (obj) => {
  // take the
  const routing = obj.update
  obj.update = (state, action) => {
    const fn = routing[action.type]
    if (!fn) {
      throw TypeError('Unknown action', action)
    }
    return fn(state, action.payload)
  }
  return obj
}

const actionsTransform = (obj) => {
  const actions = obj.actions
  const view = obj.view
  obj.view = (state, dispatch) => {
    const a = R.mapObjIndexed(
      (fn, type) => R.pipe(fn, R.assoc('payload', R.__, {type}), dispatch),
      actions
    )
    return view(state, a)
  }
  return obj
}

const {creator, start} = elmish(services)
const create = creator([
  routeTransform,
  actionsTransform,
])

const counter = create({
  init: () => {
    return { count: 0 }
  },
  update: {
    // you have access to the payload with the routing transform
    increment: (state, action) => ({ count: state.count + 1 }),
    // but you can also just use point-free if theres no action payload you care about.
    decrement: R.evolve({ count: R.dec }),
  },
  actions: {
    increment: () => {},
    decrement: () => {},
  },
  view: (state, {increment, decrement}) => {
    return h('div.counter', [
      h('button.dec', {onClick: decrement}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: increment}, '+')
    ])
  },
})

// turn everything on!
start(counter)