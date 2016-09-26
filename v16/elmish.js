import R from 'ramda'
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

const getSetter = component => {

}

// use the _init override init state or merge all static children states
export const computeInit = component => {
  if (component.state && component.state._init) {
    return component.state._init
  }
  return getStaticChildren(component).reduce(
    (acc, child) => {
      if (child.nested) {
        return merge(
          acc,
          R.set(child.nested.lens, computeInit(child), {})
        )
      }
      return merge(acc, computeInit(child))
    },
    component.state && component.state.init || {},
  )
}

//   _init: setState(computeInit(component), {}),


// pass actions and state through all children update methods
export const computeUpdate = component => {
  if (component.state && component.state._update) {
    return component.state._update
  }
  return (state, action) => {
    return getChildren(component, state).reduce(
      (acc, child) => {
        if (child.nested) {
          if (action.type === child.nested.action) {
            return R.over(
              child.nested.lens,
              st => computeUpdate(child)(st, action.payload),
              state
            )
          }
          return acc
        }
        return computeUpdate(child)(acc, action)
      },
      (component.state && component.state.update) ? component.state.update(state, action) : state,
    )
  }
}

// define this helper function so there's a static reference for the lazy tree
const _computeEffect = (fn, a, b, c) => fn(a,b)(c)

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
        if (child.nested) {
          return lazyNode(
            _computeEffect,
            [computeEffect, name, child, {
              dispatch: mapDispatch(child.nested.action, dispatch),
              state: R.view(child.nested.lens, state),
              props,
            }]
          )
        }
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

// enforce an arity of two for the partially applied arguments
const partial2 = fn => (a, b) => {
  return partial(fn)(a,b)
}

const configure = drivers => component => {
  // the global event stream
  const action$ = flyd.stream()

  // reduce the state over the action stream
  const state$ = flyd.scan(
    (state, action) => {
      console.log('scan', state, action)
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
      return action$({type, payload: payload(...args)})
    }
    return action$({type, payload})
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
    type,
    payload: payload(...args),
  }
})

export const mapDispatch = partial((key, dispatch, type, payload) => {
  if (isFunction(payload)) {
    return dispatch(key, mapPayload(type, payload))
  }
  return dispatch(key, {type, payload})
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
export const nestWith = ({getState, setState, actionType}) => component => {
  assert(
    !component.nested,
    'You cannot and should never need to nest a component more than once'
  )
  return {
    ...component,
    nested: {
      lens: R.lens(getState, setState),
      action: actionType,
    },
  }
}

export const nest = (key, component) => {
  return nestWith({
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
