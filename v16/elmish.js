import flyd from 'flyd'
import node, { thunk } from 'lazy-tree'
import { shallowEquals, deepEquals } from 'elmish/v16/utils/compare'
import { isArray, isFunction } from 'elmish/v16/utils/is'

// merge all children states with the init state
export const computeInit = app => {
  if (app.state && app.state._init) {
    return app.state._init
  }
  return (app.children || []).reduce(
    (st, child) => ({...st, ...computeInit(child)}),
    app.state && app.state.init || {},
  )
}

// pass actions to all children and lets the children do all the namespacing
export const computeUpdate = app => {
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

// TODO lazy tree can simply be a lazynode rather than an actual node. doesnt need
// all this fancy PAFE stuff
const effectThunk = thunk(([fn1, name1, child1, props1], [fn2, name2, child2, props2]) => {
  return fn1 === fn2
      && name1 === name2
      && child1 === child2
      && deepEquals(props1.dispatch, props2.dispatch)
      && shallowEquals(props1.props, props2.props)
})

const computeEffectHelper = (f,a,b,c) => f(a,b)(c)

// compute the node value, and create thunks for all children, creating a lazy tree
export const computeEffect = (name, app) => {
  if (app.effects && app.effects[`_${name}`]) {
    return app.effects[`_${name}`]
  }
  return ({dispatch, state, props}) => {
    return node(
      (app.effects && app.effects[name]) ? app.effects[name]({dispatch, state, props}) : {},
      (app.children || []).map(child => {
        return effectThunk(computeEffectHelper)(computeEffect, name, child, {dispatch, state, props})
      })
    )
  }
}

const partial = thunk(deepEquals)

const coerseToArray = type => isArray(type) ? type : [type]

const configure = drivers => app => {
  const action$ = flyd.stream()

  const state$ = flyd.scan(
    (state, action) => {
      // console.log("scan", state, action)
      return computeUpdate(app)(state, action)
    },
    computeInit(app),
    action$
  )

  const dispatch = partial((type, payload, ...args) => {
    if (isFunction(payload)) {
      return action$({type: coerseToArray(type), payload: payload(...args)})
    }
    return action$({type: coerseToArray(type), payload})
  })

  // initialize drivers so they can set up their states
  const initializedDrivers = drivers.map(driver => driver(app, dispatch))

  flyd.on(state => {
    initializedDrivers.forEach(driver => driver(state))
  }, state$)
}

const namespaceDispatch = partial((key, dispatch, type, payload) => {
  return dispatch([key, coerseToArray(type)], payload)
})

const getEffectNames = app => {
  return Object.keys(app.effects || {})
    .concat(
      (app.children || [])
        .map(child => Object.keys(child.effects || {}))
        .reduce((acc, ch) => acc.concat(ch), [])
    )
    .map(name => name[0] === '_' ? name.slice(1) : name)
}

export const namespace = (key, app) => {
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
    effects: getEffectNames(app).map(name => {
      return {
        [`_${name}`]: ({state, dispatch, props}) => {
          return computeEffect(name, app)({
            dispatch: namespaceDispatch(key, dispatch),
            state: state[key],
            props,
          })
        }
      }
    }).reduce((a, b) => {
      return {...a, ...b}
    })
  }
}

export default configure
