
const Counter1 = {
  init: {
    counter1: Counter.init,
  },
  update: (state, action, payload) => {
    if (action[0] === 'counter1') {
      return {
        ...state,
        counter1: Counter.update(state.counter1, action[1], payload),
      }
    }
    return state
  },
  effects: {
    view: ({dispatch, state, ...rest}) => {
      return Counter.view({
        ...rest,
        dispatch: (action, ...args) => dispatch(['counter1', action], ...args),
        state:state.counter1,
      })
    },
  },
}

const Counter2 = lift('counter2', Counter)

// the point of children is to be able to parse the component tree for side-effects
// that arent explicitly merged and also help with some overhead of wiring up children.
// by prefixing with and _, you're overriding the auto-wiring functionality.
// You can also have children that aren't lifted so long as there are no state/action collisions.

const CounterPair = {
  children: [Counter1, Counter2],
  effects: {
    view: ({dispatch, state}) => {
      return (
        <div>
          <Counter1.effects.view dispatch={dispatch} state={state}/>
          <Counter2.effects.view dispatch={dispatch} state={state}/>
        </div>
      )
    }
  }
}

// init and update are the reducer functions for reducing the component tree.
// this is the same function using the overrides.
const CounterPair = {
  children: [Counter1, Counter2],
  _init: init({}, [
    Counter1,
    Counter2,
  ]),
  _update: update(
    (state, action, payload) => {
      // custom update method
      return state
    }, [
      Counter1,
      Counter2,
    ])
  }
  effects: {
    _view: effect(({dispatch, state}) => {
      return (
        <div>
          <Counter1.effects.view dispatch={dispatch} state={state}/>
          <Counter2.effects.view dispatch={dispatch} state={state}/>
        </div>
      )
    }, [
      Counter1,
      Counter2,
    ]
  }
}

// todo
// - static children
// - generic side-effects
// - dynamic children
// - publish / subscribe
