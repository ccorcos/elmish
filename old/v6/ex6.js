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

const lifted = creator([
  transforms.lift,
])

// publish is for communicating with other components
// sometimes thats going to be state, and sometimes that may be entire
// react components (e.g. rendering a modal)
const counters = lifted({
  lift: {
    height: counter,
    weight: counter,
  },
  publish: (dispatch, state) => {
    return {
      stats: {
        height: state.height.count,
        weight: state.weight.count,
      }
    }
  },
})

// stateless component that reads from pub
const bmi = (pub) => {
  return h('span.bmi', [
    'BMI:', pub.stats.height * pub.stats.weight
  ])
}

// the app has the same init, update, and publish as counters
// but has a bmi view that reads the publication
const app = R.evolve({
  view: (view) => (d, s, p, ...a) => {
    return h('div.app', [
      view(d, s, p, ...a),
      bmi(p),
    ])
  }
}, counters)

// TODO: Better examples
// - explain the basic sibling problem
// - modal view
// - tooltip view

start(app)
