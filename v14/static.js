// explicit
// - must initialize component in state
// - crawl tree for child effects


// lift will nest a component inside some contet so there are no action / state collisions
// you can start this component if you want... this means, none of this crazy path stuff
// for dynamic components.

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

const CounterPair = {
  children: [Counter1, Counter2],
  _init: {
    ...Counter1.init,
    ...Counter2.init,
  },
  _update; (state, action, payload) => {
    return pipe([
      s => Counter1.update(s, action, payload),
      s => Counter2.update(s, action, payload),
    ], state)
  }
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

// Components can publish / subscribe through a global event bus.

const Counter = {
  init {
    count: 0,
  },
  update: (state, action, payload) => {
    // ...
  },
  publish: ({state, dispatch}) => {
    return {
      count: state.count,
      inc: dispatch('inc'),
    }
  },
  effects: {
    view; ({state, dispatch}) => {
      // ...
    }
  }
}

// TODO: not sure how this gets wired up yet and where laziness happens
const SomethingElse = {
  subscribe: (pub) => {
    return {
      health: pub.count,
      potion: pub.inc,
    }
  },
  effects: {
    view: ({pub}) => {
      return (
        <div>
          <button onClick={pub.potion}>drink potion</button>
          <span>{pub.health}</span>
        </div>
      )
    }
  }
}

const Game = {
  children: [Counter, SomethingElse],
  effects: {
    view: ({dispatch, state, pub}) => {
      return (
        <div>
          <Counter.effects.view dispatch={dispatch} state={state} pub={pub}/>
          <SomethingElse.effects.view dispatch={dispatch} state={state} pub={dispatch.subscribe(pub)}/>
        </div>
      )
    }
  }
}

// - pubsub
//   - isolate
// - other effects
// - dispatching batched events
// - dynamic components
