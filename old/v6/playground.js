import R from 'ramda'
import e from './elmish'
import * as Z from './z'
import * as transforms from './transforms'
import * as services from './services'

// only side-effect right now is rendering and we're using react
const root = document.getElementById('root')
const {creator, start} = elmish({
  view: services.react(root),
})

const create = creator([
  transforms.action,
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

const lift = creator([
  transforms.staticLift,
])

const counters = lift({
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

// stateless component
const bmi = (pub) => {
  return h('span.bmi', [
    'BMI:', pub.stats.height * pub.stats.weight
  ])
}

// the app gets the same state as the counter, but we want to also
// show the bmi calculation in there too
const app = R.evolve({
  view: (view) => (d, s, p, ...a) => {
    return h('div.app', [
      view(d, s, p, ...a),
      bmi(p),
    ])
  }
}, counters)

// turn everything on!
start(app)
