// TODO:
// - define the general pattern
// - motivate Z.partial and WeakMap for performance
// - motivate the need for publications
// - component builders to deal with boilerplate
// - static schema and lazy tree

// performance, publications, static schema + other services


// a component is just a basic state machine

const counter = {
  init: () => {
    return {
      count: 0
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'increment':
        return {
          count: state.count + 1
        }
      case 'decrement':
        return {
          count: state.count - 1
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state) => {
    const increment = () => dispatch({type: 'increment'}),
    const decrement = () => dispatch({type: 'decrement'}),
    return h('div.counter', [
      h('button.dec', {onClick: decrement}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: increment}, '+')
    ])
  }
}

// if you

// TODO
// - action types shouldnt be comparing strings
// - state could use immutablejs
// - increment and decrement are new functions every time


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

const pairOf = (kind) => {
  return {
    init: () => {
      kind1: kind.init(),
      kind2: kind.init(),
    },
    update: (state, action) => {
      switch (action.type) {
        case 'kind1':
          return {
            kind1: kind.update(state.kind1, action.action),
            kind2: state.kind2,
          }
        case 'kind2':
          return {
            kind1: state.kind1,
            kind2: kind.update(state.kind2, action.action),
          }
        default:
          throw new TypeError('Unknown action', action)
      }
    },
    view: (dispatch, state) => {
      const dispatch1 = (action) => dispatch({type: 'kind1', action})
      const dispatch2 = (action) => dispatch({type: 'kind2', action})
      return h('div.pair', [
        kind.view(dispatchCounter1, state.kind1),
        kind.view(dispatchCounter2, state.kind2),
      ])
    }
  }
}

const counterPair = pairOf(counter)
