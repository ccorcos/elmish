/*

The canonical component type signature:

init :: * -> state
update :: action -> state -> state
publish :: dispatch -> state -> pub
effect :: dispatch -> state -> pub -> ... -> *
component :: {init, update, publish, effect...}

Effects can have extra arguments, denoted ..., but its optional. You can have
many effects with various names.

Transforms take a component and transform it into another shape ending in
the canonical format.

transform :: component' -> component

elmish takes a list of key-value services which map to the name of the effect
function name on the component.

driver :: stream -> SIDE-EFFECT!!
service :: {driver, ...}

elmish :: {name: service} -> {creator, start}
creator :: [transform] -> component' -> component
start :: component -> SIDE-EFFECT!!


TODO:
- think harder about middleware and refactoring so theres less boilerplate
- there needs to be some default lifting functionality
- lift middleware to handle static components
- lift middleware for dynamic components

- create a console logger service
- create a hotkeys service

- performance and laziness middleware
  - focus (lens) for publication reading
- how to handle lazy trees in services

- extrapolate into a modal window
- create a hotkeys driver as an example
- register services with elmish with static type interence?
- create a dynamic listOf component
- create an app that doesnt even render!
- synchronous services?
- service translators as higher order components? (graphql, caching, etc.)

*/

import flyd from 'flyd'
import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'

const log = x => y => console.log(x, y)
const truthy = x => !!x

// Z is going to be the namespace for all the function laziness helpers
const Z = {
  // partially apply a function with some arguments with a .equals function for comparison.
  partial: (fn, ...args) => {
    let _fn = (...more) => {
      return R.apply(fn, R.concat(args, more))
    }
    _fn.fn = fn
    _fn.args = args
    _fn.equals = (fn2) => {
      return R.equals(fn2.fn, _fn.fn) &&
             R.equals(fn2.args, _fn.args)
    }
    return _fn
  },
  // use array of functions so we can partially apply
  _pipe: (fnList, ...args) => {
    const head = R.head(fnList)
    const tail = R.tail(fnList)
    const applyFn = (arg, fn) => fn(arg)
    return R.reduce(applyFn, head(...args), tail)
  },
  // partial application helper
  pipe: (fnList) => {
    return Z.partial(Z._pipe, fnList)
  },
  _forward: (dispatch, type, payload) => {
    return dispatch({type, payload})
  },
  forward: (dispatch, type) => {
    return Z.partial(Z._forward, dispatch, type)
  }
}

const elmish = (services) => ({
  creator: (transforms) => (component) => {
    const applyServices = (fn) => fn(services)
    const applyTransform = (x, fn) => fn(x)
    return R.pipe(
      R.map(applyServices),
      R.reduce(applyTransform, component),
      R.evolve({ update: R.curry }),
      R.assoc('_elmish', true)
    )(transforms)
  },
  start: (app) => {
    const action$ = flyd.stream()
    flyd.map(log('action'), action$)
    const state$ = flyd.scan(R.flip(app.update), app.init(), action$)
    // no we'll connect to each service
    const stateAndPub$ = flyd.map(state => {
      return {
        state,
        pub: app.publish(action$, state)
      }
    }, state$)
    flyd.map(log('state + pub'), stateAndPub$)
    Object.keys(services).map(name => {
      const declare$ = flyd.map(({state, pub}) => {
        return R.curry(app[name])(action$, state, pub)
      }, stateAndPub$)
      // RUN SIDE-EFFECTS!!!
      services[name].driver(declare$)
    })
  }
})

const root = document.getElementById('root')

const services = {
  react: {
    driver: (view$) => {
      flyd.on(view => ReactDOM.render(view, root), view$)
    },
    lift: (subfx) => {
      return h('span', [
        Object.keys(subfx).map(name => {
          return h(`span.${name}`, {key:name}, subfx[name]())
        })
      ])
    },
  },
}

const createAction = (type, payload) => {
  return { type, payload }
}

const transforms = {
  action: (services) => (spec) => {
    // actions take a specific format: {type, payload}
    // the type is destructured in your update function
    // update :: { type: (state, payload) => state }
    // actions are automatically partially applied to dispatch
    // actions :: { type: (...args) => payload }
    // effect :: (actions, state, pub, ...props) => effect
    // transform every effectful service function to use actions
    const effectTransform = (effect) => (dispatch, state, pub, ...props) => {
      // for each action, assign a type and the result to the payload
      const actions = R.mapObjIndexed((fn, type) => {
        // maintain value equality for the same dispatch function.
        return Z.pipe([
          fn,
          Z.forward(dispatch, type)
        ])
      }, spec.actions)
      // call the developer-defined effect function with bound actions
      return effect(actions, state, pub, ...props)
    }
    // transform the update function to use { type, payload } actions and destructuring
    const updateTransform = (types) => (action, state) => {
      const handler = types[action.type]
      if (!handler) {
        throw new TypeError(`Unknown action type ${action.type} for handlers ${Object.keys(types).join(', ')}.`)
      }
      return handler(state, action.payload)
    }
    // update the component spec
    const evolution = R.merge(
      R.map(R.always(effectTransform), services),
      { update: updateTransform }
    )
    return R.evolve(evolution, spec)
  },
  // lifting replaces init and update functions.
  staticLift: (services) => (spec) => {
    const init = (...args) => {
      return R.map(c => c.init(), spec.lift)
    }
    const update = (action, state) => {
      const updater = spec.lift[action.type].update
      if (!updater) {
        throw new TypeError(`Unknown action type ${action.type} for subcomponents ${Object.keys(spec.lift).join(', ')}.`)
      }
      return R.evolve({
        [action.type]: updater(action.payload)
      }, state)
    }

    const liftPublish = (dispatch, state) => {
      return Object.keys(spec.lift)
      .map(name => {
        const p = spec.lift[name].publish
        if (p) {
          return p(Z.forward(dispatch, name), state[name])
        }
      })
      .filter(truthy)
      .reduce(R.merge, {})
    }

    const publish = spec.publish ? spec.publish : liftPublish

    // for each effect:
    // - if it hasnt been defined, use the service.lift function
    // - otherwise pass it the subcomponent effects all wired up and partially applied
    const effects = R.mapObjIndexed((service, fxname) => (dispatch, state, pub, ...args) => {
      // create patially applied effect for each subcomponent
      const subfx = R.mapObjIndexed((sub, subname) => {
        return Z.partial(sub[fxname], Z.forward(dispatch, subname), state[subname], pub)
      }, spec.lift)
      if (spec[fxname]) {
        // let the user divvy up the props to subcomponents if they want
        return spec[fxname](subfx, ...args)
      } else {
        // bind the props and use the service lift method
        return service.lift(R.map(fn => Z.partial(fn, ...args), subfx))
      }
    }, services)

    return R.merge(effects, { init, update, publish })
  },
  dynamicLift: (services) => (spec) => {

  }
}


const {creator, start} = elmish({
  view: services.react,
})

const create = creator([
  transforms.action,
])

const noop = () => {}
const id = x => x

const counter = create({
  init: () => {
    return { count: 0 }
  },
  update: {
    inc: R.evolve({ count: R.inc }),
    dec: R.evolve({ count: R.dec }),
  },
  actions: {
    // no payloads
    inc: noop,
    dec: noop,
  },
  view: (action, state, pub) => {
    return h('div.counter', [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  },
})

const lift = creator([
  transforms.staticLift,
])

const counters = lift({
  lift: {
    height: counter,
    weight: counter,
  },
  publish: (dispatch, state) => {
    return {
      stats: {
        height: state.height.count,
        weight: state.weight.count,
      }
    }
  },
})

// stateless component
const bmi = (pub) => {
  return h('span.bmi', [
    'BMI:', pub.stats.height * pub.stats.weight
  ])
}

// the app gets the same state as the counter, but we want to also
// show the bmi calculation in there too
const app = R.evolve({
  view: (view) => (d, s, p, ...a) => {
    return h('div.app', [
      view(d, s, p, ...a),
      bmi(p),
    ])
  }
}, counters)

// turn everything on!
start(app)
