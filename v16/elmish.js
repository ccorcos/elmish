import flyd from 'flyd'
import { node, lazyNode } from 'elmish/v16/lazy-tree'
import { shallowEquals, deepEquals } from 'elmish/v16/utils/compare'
import { isArray, isFunction } from 'elmish/v16/utils/is'
import throttleWhen from 'elmish/src/utils/throttleWhen'

const assert = (truthy, message) => {
  if (!truthy) {
    throw new Error(message)
  }
}

const getStaticChildren = app => {
  return app.children || []
}

const getDynamicChildren = (app, state) => {
  assert(
    app._init,
    'If a component has dynamic children, then you must specify the ' +
    'inital state of the component using `_init`'
  )
  return app.children(state)
}

const getChildren = (app, state) => {
  if (isFunction(app.children)) {
    return getDynamicChildren(app, state)
  }
  return getStaticChildren(app)
}

// merge all children states with the init state
export const computeInit = app => {
  if (app.state && app.state._init) {
    return app.state._init
  }
  return getStaticChildren(app).reduce(
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
    return getChildren(app, state).reduce(
      (st, child) => computeUpdate(child)(st, action),
      (app.state && app.state.update) ? app.state.update(state, action) : state,
    )
  }
}

const _computeEffect = (fn, a, b, c) => fn(a,b)(c)

// compute the node value, and create lazyNodes for all children, creating a lazy tree
export const computeEffect = (name, app) => {
  if (app.effects && app.effects[`_${name}`]) {
    return app.effects[`_${name}`]
  }
  return ({dispatch, state, props}) => {
    return node(
      (app.effects && app.effects[name]) ? app.effects[name]({dispatch, state, props}) : {},
      getChildren(app, state).map(child => {
        return lazyNode(
          _computeEffect,
          [computeEffect, name, child, {dispatch, state, props}]
        )
      })
    )
  }
}

// partially apply a function that returns a function that can be compared
// based on the original funciton and the partially applied arguments so that
// we can compare dispatch functions and lazily evaluate the lazy tree.
const partial = fn => (...args) => {
  const _fn = (...more) => fn.apply(null, args.concat(more))
  _fn.__type = 'thunk'
  if (fn.__type === 'thunk') {
    _fn.fn = fn.fn
    _fn.args = fn.args.concat(args)
  } else {
    _fn.fn = fn
    _fn.args = args
  }
  _fn.equals = g => g
                   && g.__type === 'thunk'
                   && _fn.fn === g.fn
                   && g.args
                   && deepEquals(_fn.args, g.args)
  return _fn
}

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

  const throttle$ = flyd.stream(false)
  const throttledState$ = throttleWhen(throttle$, state$)

  const batch = (fn) => {
    throttle$(true)
    fn()
    throttle$(false)
  }

  // initialize drivers so they can set up their states
  const initializedDrivers = drivers.map(driver => driver(app, dispatch, batch))

  flyd.on(state => {
    initializedDrivers.forEach(driver => driver(state))
  }, throttledState$)
}

export const namespaceDispatch = partial((key, dispatch, type, payload) => {
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

// setState is really just namespacing so it can be merged.
// actionType is also just a namespace
export const namespaceWith = ({getState, setState, actionType}) => app => {
  return {
    children: app.children,
    state: {
      _init: setState(computeInit(app), {}),
      _update: (state, {type, payload}) => {
        if (type[0] === actionType) {
          return setState(
            computeUpdate(app)(getState(state), {type: type[1], payload}),
            state
          )
        }
        return state
      },
    },
    effects: getEffectNames(app).map(name => {
      return {
        [`_${name}`]: ({state, dispatch, props}) => {
            return computeEffect(name, app)({
            dispatch: namespaceDispatch(actionType, dispatch),
            state: getState(state),
            props,
          })
        }
      }
    }).reduce((a, b) => {
      return {...a, ...b}
    })
  }
}

export const namespace = (key, app) => {
  return namespaceWith({
    actionType: key,
    getState: state => state[key],
    setState: (substate, state) => {
      return {
        ...state,
        [key]: substate,
      }
    },
  })(app)
}


export default configure