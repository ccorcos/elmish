// cleanup code
// solidify the pattern.
// - overridden effects should return a lazy tree
// - normal effects are the value in the lazy tree
// - if you only use overrides, you can build your own structure like with react
//   but you dont get the help of putting it all together for you under the hood
// - lift will localize state, and mapDispatch for all the effects, init, update
//   etc. but you need to make sure to crawl the children keys to see all the
//   side-effects. children also MUST BE LIFTED. otherwise some quirks can happen
//   with namespace collisions and missing children effects when lifting.

// some potential issues
// - the effect thunk doesnt entirely work because a lifted child only cares
//   about its part of the state. so we'll need to figure that out later

// things to do next
// - clean up the hot keys driver
// - add batch update functionality with some way of merging dispatches.
// - build some other side effect drivers like http and giphy example
// - dynamic children example with listOf
// - lazy performance
// - pubsub

import R from 'ramda'
import flyd from 'flyd'
import is from 'elmish/v13+/utils/is'
import node, { thunk, reduce } from 'lazy-tree'
import ReactDriver, { h } from 'elmish/v16/drivers/react'
import HotkeysDriver from 'elmish/v16/drivers/hotkeys'
import { shallow } from 'elmish/v16/utils/compare'

// crawls children and merges all initial states
const computeInit = app => {
  if (app.state && app.state._init) {
    return app.state._init
  }
  return (app.children || []).reduce(
    (st, child) => ({...st, ...computeInit(child)}),
    app.state && app.state.init || {},
  )
}

// crawls children and computes the update method that routes actions
// through all of the of the children update functions.
// NOTE: if you're component's update function does not return the keys
// it does not mutate, then you'll only see the state return by the last
// child's update because we've merged the children states in `computeInit`
const computeUpdate = app => {
  if (app.state && app.state._update) {
    return app.state._update
  }
  return (state, action) => {
    return (app.children || []).reduce(
      (st, child) => computeUpdate(child)(st, action),
      (app.state && app.state.update) ? app.state.update(state, action) : state,
    )
  }
}






const effectThunk = thunk((args1, args2) => {
  return args1[0] === args2[0] // name
      && args1[1] === args2[1] // child
      && args1[2].state === args2[2].state
      && (args1[2].dispatch.__type === 'thunk'
      ? args1[2].dispatch.equals(args2[2].dispatch)
      : args1[2].dispatch === args2[2].dispatch)
      && shallow(args1[2].props, args2[2].props)
})

const computeEffectHelper = (f,a,b,c) => f(a,b)(c)

const computeEffect = (name, app) => {
  if (app.effects && app.effects[`_${name}`]) {
    return app.effects[`_${name}`]
  }
  return ({dispatch, state, props}) => {
    // console.log('effects', app.effects, app)
    return node(
      (app.effects && app.effects[name]) ?
      app.effects[name]({dispatch, state, props}) :
      {},
      (app.children || []).map(child => {
        // console.log('child', child.effects)
        return effectThunk(computeEffectHelper)(computeEffect, name, child, {dispatch, state, props})
      })
    )
  }
}







const partial = thunk(R.equals)
const partial2 = thunk((a,b) => a === b)

const wrapActionType = type =>
  is.array(type) ? type : [type]

const configure = drivers => app => {
  const action$ = flyd.stream()

  const state$ = flyd.scan(
    (state, action) => {
      console.log("scan", state, action)
      return computeUpdate(app)(state, action)
    },
    computeInit(app),
    action$
  )

  const _dispatch = (type, payload, ...args) =>
    is.function(payload) ?
    action$({type: wrapActionType(type), payload: payload(...args)}) :
    action$({type: wrapActionType(type), payload})

  const dispatch = partial(_dispatch)

  const initializedDrivers = drivers.map(driver => driver(app, dispatch))

  flyd.on(state => {
    initializedDrivers.forEach(driver => driver(state))
  }, state$)
}

const start = configure([
  ReactDriver(document.getElementById('root')),
  (app, dispatch) => {
    const driver = HotkeysDriver(app, dispatch)
    return state => {
      // console.log("compute")
      const effect = computeEffect('hotkeys', app)
      // console.log("evaluate")
      const tree = effect({state, dispatch})
      // console.log("reduce")
      const computation = reduce((a,b) => {
        // console.log(a, b)
        return R.mergeWith((x,y) => () => {x();y()}, a,b)
      }, undefined, tree)
      console.log(computation.result)
      // console.log(computation)
      driver(computation.result)
    }
  },
])

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
    _view: ({dispatch, state, props}) => {
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
    hotkeys: ({dispatch, state, props}) => {
      return {
        '=': dispatch('inc'),
        '-': dispatch('dec'),
      }
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
    _view: ({dispatch, state, props}) => {
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
    _view: ({dispatch, state}) => {
      return h('div.app', {}, [
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
    children: app.children,
    state: {
      _init: {
        [key]: computeInit(app),
      },
      _update: (state, {type, payload}) => {
        if (type[0] === key) {
          return {
            ...state,
            [key]: computeUpdate(app)(state[key], {type: type[1], payload})
          }
        }
        return state
      },
    },
    effects: Object.keys(app.effects || {}).concat(
      // get children's side-effects as well to accumulate so mapDispatch works for them as well
      (app.children || []).map(child => Object.keys(child.effects || {})).reduce(R.concat, [])
    ).map(name => {
      if (name[0] === '_') {
        return {
          [name]: ({state, dispatch, props}) => {
            return computeEffect(name.slice(1), app)({
              dispatch: mapDispatch(key, dispatch),
              state: state[key],
              props,
            })
          }
        }
      }
      return {
        [`_${name}`]: ({state, dispatch, props}) => {
          return computeEffect(name, app)({
            dispatch: mapDispatch(key, dispatch),
            state: state[key],
            props,
          })
        }
      }
    }).reduce(R.merge)
  }
}

const Counter1 = lift('counter', Counter)
const Username1 = lift('username', Username)

const App2 = {
  children: [Counter1, Username1],
  effects: {
    _view: ({dispatch, state}) => {
      return h('div.app', {}, [
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
      _view: ({dispatch, state}) => {
        return h('div.two-of', {}, [
          h(app1, {dispatch, state}),
          h(app2, {dispatch, state}),
        ])
      },
    },
  }
}

start(twoOf(App2))
