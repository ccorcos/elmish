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

// action and update transforms
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
    // no payloads
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

start(counter)
