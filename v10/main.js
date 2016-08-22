import { lift, start, unliftAction, liftDispatch, lensPath } from 'elmish/v10/elmish'
import h from 'react-hyperscript'
import R from 'ramda'

const Counter = {
  init: () => ({
    count : 0,
  }),
  update: (state, action, payload) => {
    switch(action) {
      case 'inc':
        return { count: state.count + 1 }
      case 'dec':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  view: (dispatch, state, props) => {
    console.log("render", state)
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc')}, '+'),
    ])
  }
}

// start(Counter)

const Counter1 = lift(['counter1'], Counter)
const Counter2 = lift(['counter2'], Counter)

const CounterPair = {
  init: () => {
    return R.pipe(
      Counter1.init,
      Counter2.init,
    )({})
  },
  update: (state, action, payload) => {
    return R.pipe(
      s => Counter1.update(s, action, payload),
      s => Counter2.update(s, action, payload)
    )(state)
  },
  view: (dispatch, state, props) => {
    return h('div', [
      Counter1.view(dispatch, state),
      Counter2.view(dispatch, state),
    ])
  }
}

// start(CounterPair)

const listOf = (kind) => {
  return {
    init: () => {
      return {
        nextId: 1,
        list: [{
          id: 0,
          state: kind.init()
        }],
      }
    },
    update: (state, action, payload) => {
      if (action === 'add') {
        return {
          nextId: state.nextId + 1,
          list: state.list.concat([{
            id: state.nextId,
            state: kind.init(),
          }]),
        }
      } else if (action === 'remove') {
        return R.evolve({
          list: R.filter(R.complement(R.propEq('id', payload)))
        }, state)
      } else {
        return state.list.reduce(
          (s, item) => {
            return lift(
              ['list', {id: item.id}, 'state'],
              kind
            ).update(s, action, payload)
          },
          state,
          state.list.items
        )
      }
    },
    view: (dispatch, state, props) => {
      return h('div', [
        h('button', {onClick: dispatch('add')}, '+'),
        state.list.map(item =>
          h('div.item', {key: item.id}, [
            lift(
              ['list', {id: item.id}, 'state'],
              kind
            ).view(dispatch, state),
            h('button', {onClick: dispatch('remove', item.id)}, 'x')
          ])
        )
      ])
    }
  }
}

// start(listOf(Counter))

const undoable = (kind) => {
  return {
    init: () => {
      return {
        time: 0,
        states: [kind.init()],
      }
    },
    update: (state, action, payload) => {
      if (action === 'undo') {
        return R.evolve({
          time: R.dec,
        }, state)
      } else if (action === 'redo') {
        return R.evolve({
          time: R.inc,
        }, state)
      } else {
        return R.pipe(
          // kill the future
          R.evolve({states: R.slice(0, state.time + 1)}),
          // copy current state to the end
          R.evolve({states: list => R.append(R.last(list), list)}),
          // unlift action is easier since the action points to the old state
          R.evolve({
            states: R.adjust(
              s => kind.update(s, action, payload),
              state.time + 1,
            )
          }),
          // increment time
          R.evolve({time: R.inc})
        )(state)
      }
    },
    view: (dispatch, state, props) => {
      const canUndo = state.time > 0
      const canRedo = state.time < state.states.length - 1
      return h('div', [
        h('button', {onClick: dispatch('undo'), disabled: !canUndo}, 'undo'),
        h('button', {onClick: dispatch('redo'), disabled: !canRedo}, 'redo'),
        kind.view(
          dispatch,
          R.view(lensPath(['states', state.time]), state),
          props
        )
      ])
    }
  }
}

// start(undoable(Counter))
// start(undoable(listOf(Counter)))

const Score = {
  init: () => ({
    count : 0,
  }),
  update: (state, action, payload) => {
    switch(action) {
      case 'inc':
        return { count: state.count + 1 }
      case 'dec':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  // publish to a global flat key-value map
  publish: (dispatch, state) => {
    return {
      score: state.count,
      goal: dispatch('inc'),
    }
  },
  view: (dispatch, state, pub, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc')}, '+'),
    ])
  }
}

const ScoreBoard = {
  // subscribe to value from the global key-value map
  subscribe: (state, pub, props) => {
    return R.pick(['score', 'goal'], pub)
  },
  view: (dispatch, state, pub, props) => {
    return h('div', [
      h('span', [
        `Score: ${pub.score}`,
      ]),
      h('button', {onClick: pub.goal}, 'goal'),
    ])
  },
}

const GameScore = lift(['score'], Score)
const GameScoreBoard = lift(['scoreboard'], ScoreBoard)

const Game = {
  init: () => {
    return R.pipe(
      GameScore.init,
      GameScoreBoard.init
    )({})
  },
  update: (state, action, payload) => {
    return R.pipe(
      s => GameScore.update(s, action, payload),
      s => GameScoreBoard.update(s, action, payload)
    )(state)
  },
  subscribe: (state, pub, props) => {
    return GameScoreBoard.subscribe(state.scoreboard, pub)
    // return R.merge(
    //   // GameScore.subscribe(pub, state),
    //   GameScoreBoard.subscribe(pub, state)
    // )
  },
  publish: (dispatch, state) => {
    return GameScore.publish(liftDispatch(dispatch, ['score']), state.score)
    // return R.merge(
    //   GameScore.publish(dispatch, state),
    //   // GameScoreBoard.publish(dispatch, state)
    // )
  },
  view: (dispatch, state, pub, props) => {
    return h('div', [
      GameScore.view(dispatch, state, pub),
      GameScoreBoard.view(dispatch, state, pub),
    ])
  },
}

start(Game)

// publication todos:
// - lift publish and subscribe
// - lifting view should call subscribe on the pubs
// - constructor function that assigns sane defaults for init, update, etc.
// helper functions:
// - lifted can wire up some boiler plate for us: lifted([counter1, counter2])
// - generic declarative side-effect drivers





// Word! A few more helper functions and this is looking slick!
// Lets start to push the limits a little bit.
// - global state / actions
// - declarative side-effects
