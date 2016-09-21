// - polish up
// - generic side-effects
// - dynamic children?
// - performance
// - pubsub

import flyd from 'flyd'
import React from 'react'
import ReactDOM from 'react-dom'
import rh from 'react-hyperscript'
import is from 'elmish/v13+/utils/is'
import { thunk, node } from 'lazy-tree'
import R from 'ramda'

const Lazy = React.createClass({
  shouldComponentUpdate(nextProps) {
    return !(
      (nextProps.view === this.props.view) &&
      (nextProps.state === this.props.state) &&
      // (shallow(nextProps.props, this.props.props)) &&
      (nextProps.dispatch.equals(this.props.dispatch))
    )
  },
  render() {
    return this.props.view(this.props)
  }
})

const h = (...args) => {
  if (args[0].effects && args[0].effects.view && args[1].dispatch && args[1].state) {
    return rh(Lazy, {view: args[0].effects.view, ...args[1]})
  }
  return rh(...args)
}

const partial = thunk(R.equals)
const partial2 = thunk((a,b) => a === b)

const wrapActionType = type =>
  is.array(type) ? type : [type]

// const makeInit = app => {
//   if (app._init) {
//     return app._init
//   }
//   return node(app.init || {}, (app.children || []).map(child => partial2(makeInit)(child)))
// }

const makeInit = app => {
  if (app.state && app.state._init) {
    return app.state._init
  }
  return R.reduce(
    (st, child) => R.merge(st, makeInit(child)),
    app.state && app.state.init || {},
    app.children || []
  )
}

const makeUpdate = app => {
  if (app.state && app.state._update) {
    return app.state._update
  }
  return (state, action) => {
    return R.reduce(
      // (st, child) => R.merge(st, makeUpdate(child)(st, action)),
      // if we merge, then multiple children dont have to be lifted, but I think
      // thats probably a good thing. this is also less performant. it would work
      // if we only used updates rather than returning an entirely new state. thats
      // just a little awkward when you look at the update method and you have to
      // so something like {...state, count: state.count + 1} when you'd expect
      // count to be the only thing in the state...
      (st, child) => makeUpdate(child)(st, action),
      (app.state && app.state.update) ? app.state.update(state, action) : state,
      app.children || []
    )
  }
}

const start = (app) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(
    (state, action) => {
      console.log("scan", state, action)
      return makeUpdate(app)(state, action)
    },
    makeInit(app),
    action$
  )

  const _dispatch = (type, payload, ...args) =>
    is.function(payload) ?
    action$({type: wrapActionType(type), payload: payload(...args)}) :
    action$({type: wrapActionType(type), payload})

  const dispatch = partial(_dispatch)

  const view$ = flyd.map(state => {
    console.log('view$', state)
    return app.effects.view({dispatch, state})
  }, state$)

  // declarative side-effect drivers
  const root = document.getElementById('root')
  flyd.on(vdom => {
    ReactDOM.render(vdom, root)
  }, view$)
}

const Counter = {
  state: {
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
      return state
    },
  },
  effects: {
    view: ({dispatch, state, props}) => {
      return h('div.counter', [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
  },
}

const targetValue = e => e.target.value

const Username = {
  state: {
    init: {
      username: '',
    },
    update: (state, {type, payload}) => {
      if (type[0] === 'username/change') {
        return {
          username: payload,
        }
      }
      return state
    },
  },
  effects: {
    view: ({dispatch, state, props}) => {
      return h('input.username', {
        value: state.username,
        onChange: dispatch('username/change', targetValue)
      })
    },
  },
}

// start(Counter)
// start(Username)

// now the question is how do we handle children and overriding now
// lifting comes later ;)

const App = {
  children: [Counter, Username],
  effects: {
    view: ({dispatch, state}) => {
      return h('div.app', [
        h(Counter, {dispatch, state}),
        h(Username, {dispatch, state}),
      ])
    },
  },
}

// this currently only works if we merge the states returned from the update
// methods, so for now, lets try to figure out how lift works.
// start(App)

const _mapDispatch = (key, dispatch, type, payload) => {
  return dispatch([key, is.array(type) ? type : [type]], payload)
}

const mapDispatch = partial(_mapDispatch)

const lift = (key, app) => {
  return {
    state: {
      _init: {
        [key]: makeInit(app),
      },
      _update: (state, {type, payload}) => {
        if (type[0] === key) {
          return {
            ...state,
            [key]: makeUpdate(app)(state[key], {type: type[1], payload})
          }
        }
        return state
      },
    },
    effects: R.map(effect => ({dispatch, state, props}) => {
      return effect({
        dispatch: mapDispatch(key, dispatch),
        state: state[key],
        props,
      })
    }, app.effects || {}),
  }
}

const Counter1 = lift('counter', Counter)
const Username1 = lift('username', Username)

const App2 = {
  children: [Counter1, Username1],
  effects: {
    view: ({dispatch, state}) => {
      return h('div.app', [
        h(Counter1, {dispatch, state}),
        h(Username1, {dispatch, state}),
      ])
    },
  },
}

// start(App2)

const twoOf = app => {
  const app1 = lift('version1', app)
  const app2 = lift('version2', app)
  return {
    children: [app1, app2],
    effects: {
      view: ({dispatch, state}) => {
        return h('div.two-of', [
          h(app1, {dispatch, state}),
          h(app2, {dispatch, state}),
        ])
      },
    },
  }
}

start(twoOf(App2))
