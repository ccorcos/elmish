import { Component, lift, start, unliftAction, liftDispatch, lensQuery } from 'elmish/v13+/elmish'
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
  view: (dispatch, state, pub, props) => {
    // console.log("render", state)
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
      Counter1._init,
      Counter2._init,
    )({})
  },
  update: (state, action, payload) => {
    return R.pipe(
      s => Counter1.update(s, action, payload),
      s => Counter2.update(s, action, payload)
    )(state)
  },
  view: (dispatch, state, pub, props) => {
    return h('div', [
      Counter1.view(dispatch, state, pub),
      Counter2.view(dispatch, state, pub),
    ])
  }
}

start(CounterPair)

// const CounterPair2 = {
//   children: [Counter1, Counter2],
//   view: (dispatch, state, pub, props) => {
//     return h('div', [
//       Counter1.view(dispatch, state),
//       Counter2.view(dispatch, state),
//     ])
//   }
// })
//
// // start(CounterPair2)
//
// const listOf = (kind) => {
//   const child = (id) => lift(['list', {id}, 'state'], kind)
//   return {
//     init: () => {
//       return {
//         nextId: 1,
//         list: [{
//           id: 0,
//           state: kind.init(),
//         }],
//       }
//     },
//     update: (state, action, payload) => {
//       if (action === 'add') {
//         return {
//           nextId: state.nextId + 1,
//           list: state.list.concat([{
//             id: state.nextId,
//             state: kind.init(),
//           }]),
//         }
//       } else if (action === 'remove') {
//         return R.evolve({
//           list: R.filter(R.complement(R.propEq('id', payload)))
//         }, state)
//       } else {
//         return state.list.reduce(
//           (s, item) => child(item.id).update(s, action, payload),
//           state,
//           state.list.items
//         )
//       }
//     },
//     view: (dispatch, state, pub, props) => {
//       return h('div', [
//         h('button', {onClick: dispatch('add')}, '+'),
//         state.list.map(item =>
//           h('div.item', {key: item.id}, [
//             child(item.id).view(dispatch, state),
//             h('button', {onClick: dispatch('remove', item.id)}, 'x')
//           ])
//         )
//       ])
//     }
//   })
// }
//
// // start(listOf(Counter))
//
// const undoable = (kind) => {
//   return {
//     init: () => {
//       return {
//         time: 0,
//         states: [kind.init()],
//       }
//     },
//     update: (state, action, payload) => {
//       if (action === 'undo') {
//         return R.evolve({
//           time: R.dec,
//         }, state)
//       } else if (action === 'redo') {
//         return R.evolve({
//           time: R.inc,
//         }, state)
//       } else {
//         return R.evolve({
//           // increment time
//           time: R.inc,
//           states: R.pipe(
//             // slice out any redo states
//             R.slice(0, state.time + 1),
//             // update the last state and append it
//             list => R.append(kind.update(R.last(list), action, payload), list),
//           )
//         })(state)
//       }
//     },
//     view: (dispatch, state, pub, props) => {
//       const canUndo = state.time > 0
//       const canRedo = state.time < state.states.length - 1
//       return h('div', [
//         h('button', {onClick: dispatch('undo'), disabled: !canUndo}, 'undo'),
//         h('button', {onClick: dispatch('redo'), disabled: !canRedo}, 'redo'),
//         kind.view(
//           dispatch,
//           R.view(lensQuery(['states', state.time]), state),
//           props
//         )
//       ])
//     },
//     hotkeys: (dispatch, state, props) => {
//       const canUndo = state.time > 0
//       const canRedo = state.time < state.states.length - 1
//       return R.merge(
//         canUndo ? {'cmd z': dispatch('undo')} : {},
//         canRedo ? {'cmd shift z': dispatch('redo')} : {},
//       )
//     }
//   })
// }
//
// start(undoable(Counter))
// // start(undoable(listOf(Counter)))
//
// const Score = {
//   init: () => ({
//     count : 0,
//   }),
//   update: (state, action, payload) => {
//     switch(action) {
//       case 'inc':
//         return { count: state.count + 1 }
//       case 'dec':
//         return { count: state.count - 1 }
//       default:
//         throw new TypeError(`Unknown action type: ${action}`)
//     }
//   },
//   // publish to a global flat key-value map
//   publish: (dispatch, state) => {
//     return {
//       score: state.count,
//       goal: dispatch('inc'),
//     }
//   },
//   view: (dispatch, state, pub, props) => {
//     return h('div.counter', [
//       h('button.dec', {onClick: dispatch('dec')}, '-'),
//       h('span.count', state.count),
//       h('button.inc', {onClick: dispatch('inc')}, '+'),
//     ])
//   }
// })
//
// const ScoreBoard = {
//   // subscribe to value from the global key-value map
//   subscribe: (state, pub, props) => {
//     return R.pick(['score'], pub)
//   },
//   view: (dispatch, state, pub, props) => {
//     return h('div', [
//       h('span', [
//         `Score: ${pub.score}`,
//       ]),
//     ])
//   },
// })
//
// const Scorer = {
//   subscribe: (state, pub, props) => {
//     return R.pick(['goal'], pub)
//   },
//   view: (dispatch, state, pub, props) => {
//     console.log('render scorer')
//     return h('div', [
//       h('button', {onClick: pub.goal}, 'goal'),
//     ])
//   }
// })
//
// const GameScore = lift(['score'], Score)
//
// const Game = {
//   init: () => {
//     return GameScore.init({})
//   },
//   update: (state, action, payload) => {
//     return GameScore.update(state, action, payload)
//   },
//   subscribe: (state, pub, props) => {
//     return R.merge(
//       ScoreBoard.subscribe(state, pub),
//       Scorer.subscribe(state, pub)
//     )
//   },
//   publish: (dispatch, state) => {
//     return GameScore.publish(dispatch, state)
//   },
//   view: (dispatch, state, pub, props) => {
//     return h('div', [
//       GameScore.view(dispatch, state),
//       ScoreBoard.view(dispatch, state, pub),
//       Scorer.view(dispatch, state, pub),
//     ])
//   },
// })
//
// // start(Game)
//
// const GameScoreBoard = lift(['scoreBoard'], ScoreBoard)
// const GameScorer = lift(['scorer'], Scorer)
//
// const Game2 = {
//   children: [GameScore, GameScoreBoard, GameScorer],
//   view: (dispatch, state, pub, props) => {
//     return h('div', [
//       GameScore.view(dispatch, state),
//       GameScoreBoard.view(dispatch, state, pub),
//       GameScorer.view(dispatch, state, pub),
//     ])
//   },
// })
//
// // start(Game2)
//
// // TODO:
// // - hotkeys service should be doing some merging/lifting and laziness
// // - lets build some services
// //   - hotkeys
// //   - http
// //   - graphql should work more like how publications work...
// // - remember that if we declare children children then we can parse through the
// //   component tree to generate and lazily merge side-effects. the hard part is
// //   when it comes to undoable and listOf since the children arent static. so we
// //   will need some kind of dynamic children function that will return the children
// //   components on demand.
// // - ideally we could lazily generate publications and subscription, but lets
// //   leave that for later...
