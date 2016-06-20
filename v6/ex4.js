import R from 'ramda'
import h from 'react-hyperscript'
import elmish from './elmish'
import * as Z from './z'
import * as transforms from './transforms'
import * as services from './services'

const root = document.getElementById('root')
const {creator, start} = elmish({
  view: services.react(root),
})

const create = creator([
  transforms.action,
  transforms.update,
])

const noop = () => {}
const id = x => x

const counter = create({
  init: () => {
    return { count: 0 }
  },
  update: {
    inc: R.evolve({ count: R.inc }),
    dec: R.evolve({ count: R.dec }),
  },
  actions: {
    inc: noop,
    dec: noop,
  },
  view: (action, state, pub) => {
    return h('div.counter', [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  },
})

// abstract to a pair of counters
const counters = create({
  init: () => {
    return {
      height: counter.init(),
      weight: counter.init(),
    }
  },
  update: {
    height: (state, action) => R.evolve({
      height: counter.update(action),
    }, state),
    weight: (state, action) => R.evolve({
      weight: counter.update(action),
    }, state),
  },
  actions: {
    height: id,
    weight: id,
  },
  view: (actions, state, pub) => {
    return h('div.counters', [
      h('div.height', [
        counter.view(actions.height, state.height)
      ]),
      h('div.weight', [
        counter.view(actions.weight, state.weight)
      ]),
    ])
  }
})

start(counters)