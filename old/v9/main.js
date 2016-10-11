// so this schema stuff is going overboard. conceptually, it makes sense.
// it alleviates the need for all this dispatch stuff going on. but it
// also means that these pure functions are more and more specific to the
// pattern which isnt good. so lets take a step back and simplify again.
// back to the basics. and who cares about performance right now. lets just
// make it work. then lets add publications. then lets add some other services.
// then lets maybe think about lazy trees and whatnot. but lets make sure
// we stick with a solid foundation.

const counter = {
  init: () => 0
  update: (state, action) => state + action
  view: (dispatch, state) => {
    const inc = () => dispatch(+1)
    const dec = () => dispatch(-1)
    return h('div.counter', [
      h('button.dec', {onClick: dec}, '-'),
      h('span.count', state),
      h('button.inc', {onClick: inc}, '+'),
    ])
  }
}

// thats how everything works. at the end of the day, thats a component, no
// matter how much sugar you put on top of it. any laziness is dealt with by
// the service and the way you constuct your declarative data structures.

// the one big issue that still left if how to create reusable components like
// listOf that can be agnostic of their childrens side-effects and simply merge
// them in an appropriate way...

// fuck it, its easy enough to create your own components. an external library
// can simply give you some helper functions so you can create your own. lets
// just focus on publish/subscribe for now.






const health = {
  init: () => 100,
  update: (state, action) => {
    switch (action.type) {
      case 'heal':
        return Math.min(state + action.amount, 100)
      case 'hurt':
        return Math.max(state - action.amount, 0)
      default:
        throw new Error()
    }
  },
  publish: (dispatch, state) => {
    return {
      health: state,
      hurt: (amount) => dispatch({type:'hurt', amount}),
      heal: (amount) => dispatch({type:'heal', amount}),
    }
  }
}

const gameOver = {
  subscribe: (state) => {
    return {
      health: R.prop('health'),
    }
  },
  // no actions, no state
  view: (dispatch, state, {health}, {onRestart}) => {
    return health > 0 ? false : h('div.game-over', [
      h('h1', 'GAME OVER'),
      h('button.restart', {onClick: onRestart}, 'try again')
    ])
  }
}

const hud = {
  subscribe: (state) => {
    return {
      health: R.prop('health'),
    }
  },
  // no actions, no state
  view: (dispatch, state, {health}) => {
    return h('div.hud', [
      h('span', `health: ${health}`)
    ])
  }
}

const game = {
  subscribe: (state) => {
    return {
      hurt: R.prop('hurt'),
      heal: R.prop('heal'),
    }
  },
  view: (dispatch, state, {hurt, heal}) => {
    return h('div.game', [
      h('button.hurt', {onClick: () => hurt(10)}, 'hurt'),
      h('button.heal', {onClick: () => heal(15)}, 'heal'),
    ])
  },
}

const app = {
  init: () => {
    health: health.init(),
  },
  update: (state, action) => {

  }
}