// lets build the elmish start function alongside the lift and child functions

import flyd from 'flyd'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import is from 'elmish/v13+/utils/is'
import { thunk } from 'lazy-tree'
import R from 'ramda'

const partial = thunk(R.equals)

const wrapActionType = type =>
  is.array(type) ? type : [type]

const start = (app) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan((state, action) => {
    // console.log("scan", state, action)
    return app.update(state, action)
  }, app.init, action$)

  const _dispatch = (type, payload, ...args) =>
    is.function(payload) ?
    action$({type: wrapActionType(type), payload: payload(...args)}) :
    action$({type: wrapActionType(type), payload})

  const dispatch = (action, payload) => partial(_dispatch)(action, payload)

  const view$ = flyd.map(state => {
    // console.log('view$', state)
    return app.view({dispatch, state})
  }, state$)

  // declarative side-effect drivers
  const root = document.getElementById('root')
  flyd.on(vdom => {
    ReactDOM.render(vdom, root)
  }, view$)
}

const Counter = {
  init: {
    count : 0,
  },
  update: (state, {type, payload}) => {
    if (type[0] === 'inc') {
      return { count: state.count + 1 }
    }
    if (type[0] === 'dec') {
      return { count: state.count - 1 }
    }
    // error
  },
  view: ({dispatch, state, props}) => {
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc')}, '+'),
    ])
  }
}

const targetValue = e => e.target.value

const Username = {
  init: {
    username: '',
  },
  update: (state, {type, payload}) => {
    if (type[0] === 'username/change') {
      return {
        username: payload,
      }
    }
  },
  view: ({dispatch, state, props}) => {
    return h('input.username', {
      value: state.username,
      onChange: dispatch('username/change', targetValue)
    })
  }
}

start(Username)
