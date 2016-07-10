const R = require('ramda')

// TODO:
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

