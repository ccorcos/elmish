import R from 'ramda'
import * as Z from './z'

// transforms are middleware (essentially function decorators) for modifying
// component specifications when they are created.

// assuming actions take the format { type, payload }, we can create a shorthand
// that deals with all the dispatching stuff for us. using Z it will maintain
// PAFE so services like React and evaluate lazily.
export const action = (services) => (spec) => {
  // spec.actions :: { type: (...args) -> payload }
  // declare :: (actions, state, pub, props) -> DDS
  // transform every service function to use actions instead of dispatch
  const transform = (declare) => (dispatch, state, pub, props) => {
    // for each action return a function that takes arguments, transforms
    // into the payload, and dispatches it
    const actions = R.mapObjIndexed((fn, type) => {
      return Z.pipe([ fn, Z.forward(dispatch, type) ])
    }, spec.actions)
    // call the developer-defined declare function with bound actions
    return declare(actions, state, pub, props)
  }

  // we want to evolve the spec for every service delcare function.
  // we'll use R.always that that get the Map { name: transform }
  const evolution = R.map(R.always(transform), services)
  return R.evolve(evolution, spec)
}

export const update = (service) => (spec) => {
  // assuming actions of the format { type, payload }, we can destruture the
  // update function based on the action type.
  // update :: { type: (state, payload) -> state }
  const transform = (types) => (action, state) => {
    const handler = types[action.type]
    if (!handler) {
      const types = Object.keys(types).join(', ')
      throw new TypeError(`Unknown action type ${action.type} for handlers ${types}.`)
    }
    return handler(state, action.payload)
  }
  return R.evolve({ update: transform }, spec)
}

// TODO:
// - static lift
// - dynamic lifting
// - define assumptions about init and update
// This needs to become a core part of elmish.
export const lift = (services) => (spec) => {
  // given a static spec of Map { name: Component }
  // initialize a state of the same structure.
  const init = (...args) => {
    return R.map(c => c.init(), spec.lift)
  }
  // update the sub-component state based on the action type.
  const update = (action, state) => {
    const updater = spec.lift[action.type].update
    if (!updater) {
      const types = Object.keys(spec.lift).join(', ')
      throw new TypeError(`Unknown action type ${action.type} for subcomponents ${types}.`)
    }
    return R.evolve({
      [action.type]: substate => updater(action.payload, substate)
    }, state)
  }
  // lift publish by simply merging the Maps
  // XXX refactor to use an Either and a traverse  ;)
  const pub = (dispatch, state) => {
    // not every sub-component has to define a publish function
    return Object.keys(spec.lift)
    .map(name => {
      const p = spec.lift[name].publish
      if (p) {
        // maintain PAFE
        return p(Z.forward(dispatch, name), state[name])
      }
    })
    .filter(x => !!x)
    .reduce(R.merge, {})
  }
  const publish = spec.publish ? spec.publish : pub

  // for each service declare function, lets wire up dispatch and hand you a function
  // that just takes props for each child.
  const declares = R.mapObjIndexed((service, fxname) => (dispatch, state, pub, props) => {
    // create patially applied effect for each subcomponent
    const subfx = R.mapObjIndexed((sub, subname) => {
      return Z.partial(sub[fxname], Z.forward(dispatch, subname), state[subname], pub)
    }, spec.lift)
    if (spec[fxname]) {
      // if the user defined the effect, then pass the subfx with props
      return spec[fxname](subfx, props)
    } else {
      // otherwise bind the props to children and use the service lift method
      return service.lift(R.map(fn => fn(props), subfx))
    }
  }, services)
  return R.merge(declares, { init, update, publish })
}
