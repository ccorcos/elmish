const R = require('ramda')
const Z = require('../v6/z')

// we need to figure this out much slower.
// lets just do the schema stuff for now.

const counter = {
  init: 0,
  update: {
    // since the function length is 1, then the action has no payload.
    inc: (state) => state + 1,
    dec: (state) => state - 1,
  },
  view: ({inc, dec}, count) => {
    return h('div.counter', [
      h('button.dec', {onClick: dec}, '-'),
      h('span.count', count),
      h('button.inc', {onClick: inc}, '+'),
    ])
  }
}

const bmi = {
  init: {},
  // schema can be a function of state
  children: {
    // key is the name of the children
    height: {
      type: counter,
      // lens is for getting and setting the child state
      setter: R.assoc('height'),
      getter: R.prop('height')
    },
    weight: {
      type: counter,
      setter: R.assoc('weight'),
      getter: R.prop('weight')
    }
  },
  // children are passed as first argument
  view: ({height, weight}, state) => {
    return h('div.bmi', [
      height.view(),
      weight.view(),
      h('span', state.height * state.weight)
    ])
  }
}



// parse through children to generate initial values
const makeInitialState = (type) => {
  if (type.children) {
    return R.reduce((state, child) => {
      const childState = makeInitialState(child.type)
      return child.setter(childState, state)
    }, state, R.values(type.children))
  } else {
    return type.init
  }
}

// create updates for children
const makeChildrenUpdate = (type) => {
  if (type.children) {
    return R.map((child) => {
      return makeUpdate(child.type)
    }, type.children)
  } else {
    return {}
  }
}

// merge local updates with children updates and convert into a reducer
const makeUpdate = (type) => {
  const childrenUpdate = makeChildrenUpdate(type)
  const localUpdate = type.update || {}
  const updates = R.merge(localUpdate, childrenUpdate)
  return (state, action) => {
    const update = updates[action.type]
    if (update) {
      return update(state, action.payload)
    } else {
      throw new Error('Unknown action', action)
    }
  }
}

const makeLocalActions = (type) => {

}

const start = (app) => {

  const action$ = flyd.stream()

}


// hmm maybe this schema stuff is a little much. we're using pure functions
// but now its hard to test, and we can do things like just render a view
// with some state...