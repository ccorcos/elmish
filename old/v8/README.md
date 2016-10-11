
A basic component like a counter.

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  effect: actions -> state -> props -> *
}

A component like an input where you need to transform actions like `e.target.value`

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  actions: {
    type: * -> action
  },
  effect: actions -> state -> props -> *
}

A component that publishes information, like a cache or some other global information.

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  publish: action -> state -> props -> pub,
  effect: actions -> state -> props -> *
}

A component that subscribes to published data. Like a modal window.

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  subscribe: state -> props -> lens,
  effect: actions -> state -> pub -> props -> *
}

A basic component with sub components

component :: {
  schema :: {
    name: component
  }
}



component :: {
  init: () -> state,
  schema :: state -> {field: {type, lens}}
}











// TODO:
// actions cant get props because they should be agnostic of which side-effect they apply to.
// how do subscriptions compose?
// how to do schema stuff?
//   - when is an effect overridden or merged?
//   - when is update overridden or merged?
//   - how do we deal with listOf and undoable?
// how to build a service

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


const start = (app) => {
  const action$ = flyd.stream()
  const actions = R.mapIndexed((fn, type) => {
    if (fn.length === 1) {
      return () => $action({type})
    } else if (fn.length === 2) {
      return (payload) => $action({type, payload})
    } else {
      throw new Error()
    }
  }, app.actions)
  const update = (state, action) => {
    if (app.update[action.type]) {
      return app.update[action.type](state, action.payload)
    } else {
      throw new Error()
    }
  }
  const state$ = flyd.scan(update, app.init, action$)
  const html$ = flyd.map(R.curry(app.view)(actions), state$)
  // render
}




const input = {
  init: '',
  update: {
    // this action has a payload
    onChange: (state, value) => value
  },
  // we can override the update actions and transform the payloads
  // into serializable data, or simply call functions passed as props.
  actions: ({onChange}, value, {onSubmit}) => {
    return {
      onChange: (e) => onChange(e.target.value),
      onKeyDown: (e) => e.keyCode === 13 ? onSubmit(value) : undefined
    }
  },
  view: ({onKeyDown, onChange}, value) => {
    return h('input', {onChange, value, onKeyDown})
  }
}

// this component doesnt even have a view, but publishes data with hooks
// into its own actions!
const health = {
  init: 100,
  update: {
    heal: (state, amount) => Math.min(state + amount, 100)
    hurt: (state, amount) => Math.max(state - amount, 0),
  },
  publish: ({hurt, heal}, health) => {
    return {
      health,
      hurt,
      heal
    }
  }
}

// this component has no state, but subscribes to display GAME_OVER when
// a user's health is 0
const gameOver = {
  subscribe: {
    // XXX probably need something better here so we can compose subscriptions
    // all the way up to the root for efficient updates
    health: R.prop('health')
  },
  // no actions, no state
  view: ({health}, {onRestart}) => {
    return health > 0 ? false : h('div.game-over', [
      h('h1', 'GAME OVER'),
      h('button.restart', {onClick: onRestart}, 'try again')
    ])
  }
}




