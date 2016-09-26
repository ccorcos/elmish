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

const merge = (a, b) => ({...a, ...b})

// most components will have static children
const getStaticChildren = component => {
  return component.children || []
}

// when a component has dynamic children, then the children are a function of
// that components state which must be overridden using _init
const getDynamicChildren = (component, state) => {
  assert(
    component.state && component.state._init,
    'If a component has dynamic children, then you must specify the ' +
    'inital state of the component using `_init`'
  )
  return component.children(state)
}

// gets static or dynamic children
const getChildren = (component, state) => {
  if (isFunction(component.children)) {
    return getDynamicChildren(component, state)
  }
  return getStaticChildren(component)
}

// use the _init override init state or merge all static children states
export const computeInit = component => {
  if (component.state && component.state._init) {
    return component.state._init
  }
  return getStaticChildren(component).reduce(
    (acc, child) => merge(acc, computeInit(child)),
    component.state && component.state.init || {},
  )
}

// pass actions and state through all children update methods
export const computeUpdate = component => {
  if (component.state && component.state._update) {
    return component.state._update
  }
  return (state, action) => {
    return getChildren(component, state).reduce(
      (acc, child) => computeUpdate(child)(acc, action),
      (component.state && component.state.update) ? component.state.update(state, action) : state,
    )
  }
}

// define this helper function so there's a static reference for the lazy tree
const _computeEffect = (fn, a, b, c) => fn(a,b)(c)

// override function should return a lazy tree, otherwise its a function that
// returns the value of the node inside a lazy tree.
export const computeEffect = (name, component) => {
  if (component.effects && component.effects[`_${name}`]) {
    return component.effects[`_${name}`]
  }
  return ({dispatch, state, props}) => {
    return node(
      (component.effects && component.effects[name]) ? component.effects[name]({dispatch, state, props}) : {},
      getChildren(component, state).map(child => {
        return lazyNode(
          _computeEffect,
          [computeEffect, name, child, {dispatch, state, props}]
        )
      })
    )
  }
}

// partially apply a function that returns a function that can be compared
// based on the original function and the partially applied arguments so that
// we can compare dispatch functions and lazily evaluate the lazy tree.
const partial = fn => (...args) => {
  const _fn = (...more) => fn.apply(null, args.concat(more))
  _fn.__type = 'dispatch'
  if (fn.__type === 'dispatch') {
    _fn.fn = fn.fn
    _fn.args = fn.args.concat(args)
  } else {
    _fn.fn = fn
    _fn.args = args
  }
  _fn.equals = g => g
                 && g.__type === 'dispatch'
                 && _fn.fn === g.fn
                 && g.args
                 && deepEquals(_fn.args, g.args)
  return _fn
}

const coerseToArray = type => isArray(type) ? type : [type]

const configure = drivers => component => {
  const action$ = flyd.stream()

  const state$ = flyd.scan(
    (state, action) => {
      console.log("scan", state, action)
      const next = computeUpdate(component)(state, action)
      console.log("state", next)
      return next
    },
    computeInit(component),
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
  const initializedDrivers = drivers.map(driver => driver(component, dispatch, batch))

  flyd.on(state => {
    initializedDrivers.forEach(driver => driver(state))
  }, throttledState$)
}

export const namespaceDispatch = partial((key, dispatch, type, payload) => {
  return dispatch([key, coerseToArray(type)], payload)
})

const getEffectNames = component => {
  return Object.keys(component.effects || {})
    .concat(
      (component.children || [])
        .map(child => Object.keys(child.effects || {}))
        .reduce((acc, ch) => acc.concat(ch), [])
    )
    .map(name => name[0] === '_' ? name.slice(1) : name)
}

// setState is really just namespacing so it can be merged.
// actionType is also just a namespace
export const namespaceWith = ({getState, setState, actionType}) => component => {
  return {
    children: component.children,
    state: {
      _init: setState(computeInit(component), {}),
      _update: (state, {type, payload}) => {
        if (type[0] === actionType) {
          return setState(
            computeUpdate(component)(getState(state), {type: type[1], payload}),
            state
          )
        }
        return state
      },
    },
    effects: getEffectNames(component).map(name => {
      return {
        [`_${name}`]: ({state, dispatch, props}) => {
            return computeEffect(name, component)({
            dispatch: namespaceDispatch(actionType, dispatch),
            state: getState(state),
            props,
          })
        }
      }
    }).reduce(merge)
  }
}

export const namespace = (key, component) => {
  return namespaceWith({
    actionType: key,
    getState: state => state[key],
    setState: (substate, state) => {
      return {
        ...state,
        [key]: substate,
      }
    },
  })(component)
}


export default configure
