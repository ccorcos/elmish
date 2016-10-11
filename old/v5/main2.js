/*
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
  create: (x) => x,
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

const {create, start} = elmish(services)

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

// turn everything on!
start(counter)