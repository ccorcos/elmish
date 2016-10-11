import R from 'ramda'
import flyd from 'flyd'
import { node, lazyNode } from 'elmish/v16/lazy-tree'
import { shallowEquals, deepEquals } from 'elmish/v16/utils/compare'
import { isArray, isFunction, isPlainObject } from 'elmish/v16/utils/is'
import throttleWhen from 'elmish/src/utils/throttleWhen'

const assert = (truthy, message) => {
  if (!truthy) {
    throw new Error(message)
  }
}

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

export const computeChildInit = component => {
  if (component.nested) {
    return R.set(
      component.nested.lens,
      computeInit(component),
      {}
    )
  }
  return computeInit(component)
}

// use the _init override init state or merge all static children states
export const computeInit = component => {
  if (component.state && component.state._init) {
    return component.state._init
  }
  return getStaticChildren(component).reduce(
    (acc, child) => R.merge(acc, computeChildInit(child)),
    component.state && component.state.init || {},
  )
}

export const computeChildUpdate = (component) => (state, action) => {
  if (component.nested) {
    if (action.type === component.nested.action.type) {
      return R.over(
        component.nested.lens,
        st => computeUpdate(component)(st, action.payload),
        state
      )
    }
    return state
  }
  return computeUpdate(component)(state, action)
}

// pass actions and state through all children update methods
export const computeUpdate = component => {
  if (component.state && component.state._update) {
    return component.state._update
  }
  return (state, action) => {
    return getChildren(component, state).reduce(
      (acc, child) => computeChildUpdate(child)(acc, action),
      (component.state && component.state.update) ? component.state.update(state, action) : state,
    )
  }
}

// define this helper function so there's a static reference for the lazy tree
const _computeEffect = (fn, a, b, c) => fn(a,b)(c)

export const computeEffectProps = (child, {dispatch, state, props}) => {
  if (child.nested) {
    return {
      dispatch: mapDispatch(child.nested.action, dispatch),
      state: R.view(child.nested.lens, state),
      props,
    }
  }
  return {dispatch, state, props}
}

// WIP -- how do we make laziness work while remaining convenient?
// this function needs to return a node, not a function!
export const computeChildEffect = (name, component, {dispatch, state, props}) => {
  if (child.nested) {
    return computeEffect(name, component)({
      dispatch: mapDispatch(child.nested.action, dispatch),
      state: R.view(child.nested.lens, state),
      props,
    })
  }
  return computeEffect(name, component)({dispatch, state, props})
}

// TODO there should be a way to only compute children once per state. and then
// compute effects down a single tree

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
          [computeEffect, name, child, computeEffectProps(child, {dispatch, state, props})]
        )
      })
    )
  }
}

export const lazyEffectNode = (name, component, {dispatch, state, props}) => {
  return lazyNode(
    _computeEffect,
    [computeEffect, name, component, computeEffectProps(component, {dispatch, state, props})]
  )
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

// enforce an arity of two for the partially applied arguments
const partial2 = fn => (a, b) => {
  return partial(fn)(a,b)
}

const getActionType = type => {
  if (isPlainObject(type)) {
    assert(
      type.type,
      'Actions defined as object literals must have a `type` property.'
    )
    return type
  }
  return { type }
}

const configure = drivers => component => {
  // the global event stream
  const action$ = flyd.stream()

  // reduce the state over the action stream
  const state$ = flyd.scan(
    (state, action) => {
      return computeUpdate(component)(state, action)
    },
    computeInit(component),
    action$
  )

  // using partial, we're able to compare dispatch functions with .equals.
  // the payload can be a functoin which will transform the rest of the inputs
  // or it can be a static variable in which case it will be the payload.
  const dispatch = partial2((type, payload, ...args) => {
    if (isFunction(payload)) {
      return action$({...getActionType(type), payload: payload(...args)})
    }
    return action$({...getActionType(type), payload})
  })

  // allow drivers to batch action updates
  const throttle$ = flyd.stream(false)
  const throttledState$ = throttleWhen(throttle$, state$)
  const batch = (fn) => {
    throttle$(true)
    fn()
    throttle$(false)
  }

  // initialize drivers so they can set up their states
  const initializedDrivers = drivers.map(driver => {
    return {
      ...driver,
      listener: driver.initialize(component, dispatch, batch)
    }
  })

  // pipe side-effects to the drivers
  flyd.on(state => {
    initializedDrivers.forEach(driver => {
      driver.listener(computeEffect(driver.effect, component)({state, dispatch}))
    })
  }, throttledState$)
}

const mapPayload = partial((type, payload, ...args) => {
  return {
    ...getActionType(type),
    payload: payload(...args),
  }
})

export const mapDispatch = partial((key, dispatch, type, payload) => {
  if (isFunction(payload)) {
    return dispatch(key, mapPayload(type, payload))
  }
  return dispatch(key, {...getActionType(type), payload})
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
// actionType is also just a nest
export const nestWith = ({getState, setState, action}) => component => {
  assert(
    !component.nested,
    'You cannot and should never need to nest a component more than once'
  )
  return {
    ...component,
    nested: {
      action,
      lens: R.lens(getState, setState),
    },
  }
}

export const nest = (key, component) => {
  return nestWith({
    action: { type: key },
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
