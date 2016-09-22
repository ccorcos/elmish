import node, { thunk } from 'lazy-tree'
import { shallow } from 'elmish/v16/utils/compare'
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

const partial = thunk(([type1, payload1], [type2, payload2]) => {
  return type1 === type2 && payload1 === payload2
})

const wrapActionType = type =>
  isArray(type) ? type : [type]

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
      return action$({type: wrapActionType(type), payload: payload(...args)})
    }
    return action$({type: wrapActionType(type), payload})
  }

  // initialize drivers so they can set up their states
  const initializedDrivers = drivers.map(driver => driver(app, dispatch))

  flyd.on(state => {
    initializedDrivers.forEach(driver => driver(state))
  }, state$)
}

export default configure
