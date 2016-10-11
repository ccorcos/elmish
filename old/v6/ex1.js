import R from 'ramda'
import h from 'react-hyperscript'
import elmish from './elmish'
import * as Z from './z'
import * as transforms from './transforms'
import * as services from './services'

const root = document.getElementById('root')

// only side-effect right now is rendering and we're using react
const {creator, start} = elmish({
  view: services.react(root),
})

// no middleware just yet
const create = creator([])

// TODO: More examples
// - using JSX
// - using Z to explain PAFE
const counter = create({
  init: () => {
    return { count: 0 }
  },
  update: (action, state) => {
    switch (action.type) {
      case 'increment':
        return { count: state.count + 1 }
      case 'decrement':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action ${action.type}.`)
    }
  },
  view: (dispatch, state, pub, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  }
})

start(counter)
