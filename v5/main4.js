/*

- use two sibling counters to create a BMI calculator using state subscriptions

We've added a new concept of publications. This is all for local component
communication. Its allows you to dissociate the structure of your state from
the underlying datamodel. This allows you to do things like set the modal view
for a page from a component deeply nested in the component heirarchy.

It also allows you to create a higher order component that delegates http requests,
caches the results, and publishes the results to the rest of the application. Thus,
each component has access to some formatted global state from which to syncrhonously
load cached data in a pure and functional way!

Note that publications are a pure function of the state of the application! Thus
you dont need to care that its not necessarily serializable. Publish a who react dom
view to another part of the component heirarchy like a modal view and listen for
action responses!

This concept really solves some problems for us. I think its a totally fair assumption
that all services should be asynchronous now. Not sure I'm 100% sold on this, but
I think its a possibility...

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
    // do any lifting in regards to services
    // then pipe through the transforms
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