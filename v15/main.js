const Counter = {
  init: {
    count : 0,
  },
  update: (state, action, payload) => {
    if (action[0] === 'inc') {
      return { count: state.count + 1 }
    }
    if (action[0] === 'dec') {
      return { count: state.count - 1 }
    }
    // error
  },
  view: ({dispatch, state, props}) => {
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc')}, '+'),
    ])
  }
}

const Counter1 = {
  _init: {
    counter1: Counter.init,
  },
  _update: (state, action, payload) => {
    if (action[0] === 'counter1') {
      return Counter.update(state, action[1], payload)
    }
    // error
  },
  view: ({dispatch, state, props}) => {
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc')}, '+'),
    ])
  }
}

const lift = (key, component) => {
  //  TODO
}

const Counter2 = lift('counter2', Counter)

const CounterPair = {
  children: [Counter1, Counter2],
  view: ({dispatch, state, props}) => {
    return h('div.counter-pair', [
      h(Counter1),
      h(Counter2),
    ])
  }
}

const _CounterPair = {
  _init: init({}, [
    Counter1,
    Counter2,
  ]),
  _update: update([
      Counter1,
      Counter2,
    ])
  }
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
  ])
}

// todo
// - static children
// - generic side-effects
// - dynamic children
// - publish / subscribe
