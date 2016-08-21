// havent touched this in a while so lets give it another whirl
// this time, lets think about things from another angle again

// look at snabbdom.

// what are we doing here?
// - trying to build pure functional components
// - trying to build powerful, generic abstractions
// - declarative side-effects
// - performant / efficient updates

// where to start?
// - what does a counter look like?
// - what about a counter pair?
//   - independent
//   - dependent
// - what about a component that renders a bunch child components?
// - can we build clean abstractions around actions, update, and dispatch?
//
// what to look at next?
// - listOf, undoable, additive animation
// - publish/subscribe
// - hotkeys and http effects

const counterPair = {
  init: () => {
    counter1: counter.init(),
    counter2: counter.init(),
  },
  update: (state, action) => {
    switch (action.type) {
      case 'counter1':
        return {
          counter1: counter.update(state.counter1, action.action),
          counter2: state.counter2,
        }
      case 'counter2':
        return {
          counter1: state.counter1,
          counter2: counter.update(state.counter2, action.action),
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state) => {
    const dispatchCounter1 = (action) => dispatch({type: 'counter1', action})
    const dispatchCounter2 = (action) => dispatch({type: 'counter2', action})
    return h('div.counter-pair', [
      counter.view(dispatchCounter1, state.counter1),
      counter.view(dispatchCounter2, state.counter2),
    ])
  }
}

// think about how middleware works. thats what's basically happening...

const update = state => action => next => {
  if (action.type === "some-action") {
    return R.evolve({count: R.inc}, state)
  } else {
    return next(state, action)
  }
}

// so if we know the component's children, then we can handle child updates like middleware
// how about listOf and undoable?
// - undoable is easy since we can control the state easily and ignore actions
// - listOf just means that we need to be able to route actions properly through the tree...
//
// whats worse about this?
// - we cant control independent vs dependent copies of a component
// - compared to redux, we dont have access to a global state environment
//
// what if we played around with something more like omish where components need to query the state?


const counter = {
  // query the state the application
  // a component can modify this to abstract it
  // any value that has a `true`
  query: {},
  init: {count: 1},
}

const map = (fn, component) => R.evolve({query: fn}, component)


// this means that we've solved the dispatch problem. because we dont need PAFE anymore
// since we're doing that same basic thing via querying! we dont even need publications anymore either!!

const listOf = (kind) => ({
  query: {},
  init: {
    id: 1,
    list: [{id: 0, state: kind.query.
  }
})













// we're going to use a path specifier for the component state rather than
// mapping over dispatch and all that. should make things easier.

const counter = {
  path: [],
  init: {
    count : 0,
  },
  update: (state, action) => {
    switch(action.type) {
      case 'inc':
        return { count: state.count + 1 }
      case 'dec':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action type: ${action.type}`)
    }
  }
  actions: (state, props) => {
    return {
      inc: () => {},
      dec: () => {},
    }
  },
  view: (state, actions, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: actions.dec}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: actions.inc}, '+'),
    ])
  }
}

const pair = {
  init: {
    counter1: counter.init,
    counter2: counter.init,
  },
  update: (state, action) => {
    switch(action.type) {
      case 'counter1':
        return R.evolve({counter1: s => counter.update(s, action.payload)}, state)
      case 'counter2':
        return R.evolve({counter2: s => counter.update(s, action.payload)}, state)
      default:
        throw new TypeError(`Unknown action type: ${action.type}`)
    }
  },
  view: (state, actions, props) => {
    return (
      h('div', [
        counter(state.counter1),
        counter(state.counter2),
      ])
    )
  }
}

const counter1 = lift('counter1', counter)
const counter2 = lift('counter2', counter)

const pair = {
  path: [],
  init: merge(counter1.init, counter2.init),
  // let the subcomponents check for the type
  update: (s, a) => counter2.update(counter1.update(s, a), a),
  // let the subcomponents get their own state!
  view: (state, actions, props) => {
    return (
      h('div', [
        counter1,
        counter2,
      ])
    )
  }
}





// lifting a component involves updating a lens with which to set and get from
// the state and a function to wrap and unwrap actions for the update and view
// functions.

const prefix = R.add
const suffix = R.flip(R.add)
const startsWith = R.curry((q, str) => str.startsWith(q))
const endsWith = R.curry((q, str) => str.endsWith(q))
const stripl = R.curry((q, str) => startsWith(q, str) ? str.slice(q.length) : str)
const stripr = R.curry((q, str) => endsWith(q, str) ? str.slice(0, str.length - q.length) : str)
const strip = R.curry((q, str) => stripl(q, stripr(q, str)))

const counter = {
  // state
  setter: R.assoc('counter1'),
  getter: R.prop('counter1'),
  // dispatch
  wrap: R.evolve({type: prefix('counter1/')}),
  match: R.where({type: startsWith('counter1/')})
  unwrap: R.evolve({type: stripl('counter1/')})
  //
  init: {
    count : 0,
  },
  update: (state, action) => {
    switch(action.type) {
      case 'inc':
        return { count: state.count + 1 }
      case 'dec':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action type: ${action.type}`)
    }
  }
  view: (event, state, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: event({type: 'dec'})}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: event({type: 'inc'})}, '+'),
    ])
  }
}

const start = (app) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(app.update, app.init, action$)
  const event = (data) => (...args) => isFunction(data) ? action$(data(...args)) action$(data)
  const html$ = flyd.map(app.view(event), state$)
}



const component = (obj) => {
  // obj must have init, update, and view
  return {
    // state
    setter: R.assoc('counter1'),
    getter: R.prop('counter1'),
    // dispatch
    wrap: R.evolve({type: prefix('counter1/')}),
    match: R.where({type: startsWith('counter1/')})
    unwrap: R.evolve({type: stripl('counter1/')})
    //
    init: {
      count : 0,
    },
    update: (state, action) => {
      switch(action.type) {
        case 'inc':
          return { count: state.count + 1 }
        case 'dec':
          return { count: state.count - 1 }
        default:
          throw new TypeError(`Unknown action type: ${action.type}`)
      }
    }
    view: (event, state, props) => {
      return h('div.counter', [
        h('button.dec', {onClick: event({type: 'dec'})}, '-'),
        h('span.count', state.count),
        h('button.inc', {onClick: event({type: 'inc'})}, '+'),
      ])
    }
  }
}










// class Component {
//
//   // setting and getting from global state
//   setter = R.identity
//   getter = R.identity
//   // wrapping and unwrapping actions from global event bus
//   wrap = R.identity
//   match = R.always(true)
//   unwrap = R.identity
//
//   lift = (key) => {
//
//   }
//   // update
//   // view
// }









// ---------------




const prefix = R.add
const suffix = R.flip(R.add)
const startsWith = R.curry((q, str) => str.startsWith(q))
const endsWith = R.curry((q, str) => str.endsWith(q))
const stripl = R.curry((q, str) => startsWith(q, str) ? str.slice(q.length) : str)
const stripr = R.curry((q, str) => endsWith(q, str) ? str.slice(0, str.length - q.length) : str)
const strip = R.curry((q, str) => stripl(q, stripr(q, str)))


const Component = (obj) => {
  return {
    ...obj,
    __type: 'Elmish.Component',
    path: [],
  }
}

const lift = (key, obj) => {
  const pre = `${key}/`
  return {
    ...obj,
    // keep track of the path for debugging
    path: [key].concat(obj.path)
    // nest the state
    init: {
      [key]: obj.state,
    },
    // unprefix action and update nested state
    update: (state, action, payload) => {
      if (startsWith(pre, action)) {
        return R.evolve({
          [key]: obj.update(state[key], stripl(pre, action), payload)
        }, state)
      } else {
        return state
      }
    },
    // prefix actions and pass on nested state
    view: (event, state, props) => {
      return obj.view(
        R.compose(event, prefix(pre)),
        state[key],
        props
      )
    }
  }
}

const Elmish = {
  Component,
  lift,
}

const Counter = Elmish.Component({
  init: {
    count : 0,
  },
  update: (state, action, payload) => {
    switch(action) {
      case 'inc':
        return { count: state.count + 1 }
      case 'dec':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  }
  view: (event, state, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: event('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: event('inc')}, '+'),
    ])
  }
})

const Counter1 = Elmish.lift('counter1', Counter)
const Counter2 = Elmish.lift('counter2', Counter)

const CounterPair = Elmish.Component({
  init: R.merge(Counter1.init, Counter2.init),
  update: (state, action, payload) => {
    return Counter1.update(Counter1.update(state, action, payload), action, payload)
  },
  view: (event, state, props) => {
    return h('div', [
      Counter1.view(event, state),
      Counter2.view(event, state),
    ])
  }
})

// Word! A few more helper functions and this is looking slick!
// Lets start to push the limits a little bit.
// - listOf
// - undoable
// - dependent counters


const listOf = (kind) => {
  return {
    init: {
      id: 1,
      list: [{id: 0, state: kind.init}],
    },
    update: (state, action, payload) => {
      if (action === 'add') {
        return {
          id: state.id + 1,
          list: list.concat([{
            id: state.id,
            state: kind.init,
          }])
        }
      } else if (action === 'remove') {
        return R.evolve({
          list: R.filter(R.complement(R.propEq('id', payload)))
        }, state)
      } else {
        return state.list.reduce((st, item) => {
          return lift(['list', {id: item.id}, 'state'], kind).update(st, action, payload)
        }, state, list.items)
      }
    },
    view: (event, state, props) => {
      return h('div', [
        h('button', {onClick: event('add')}, '+'),
        state.list.map(item =>
          h('div.item', [
            kind.view(event, state, {onRemove: event('remove', item.id)})
          ])
        )
      ])
    }
  }
}

// so the lift function is going to have a rather complicated path now.
// any of the complicated laziness performance features are also all handled
// within the lifting of the component.
// i dont forsee any issues with building the undoable function...
// as far as dependent counters, thats not terribly hard...
// not sure how we're going to incorporate other declarative side-effects yet...
// we may also want to build this using Immutable from the ground up. Otherwise
// performance will suffer. however, the performance hit isnt bad for deep state,
// just wide state.
