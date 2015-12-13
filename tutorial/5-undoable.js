// Another abstraction that makes this pattern so powerful is undo/redo.
// We'll implement undo/redo support for a component by simply remembering
// states in a list.

import h from 'react-hyperscript'
import start from 'src/elmish'
import render from 'src/service/react'
import counter from 'lib/counter'
import curry from 'ramda/src/curry'
import evolve from 'ramda/src/evolve'
import dec from 'ramda/src/dec'
import inc from 'ramda/src/inc'
import concat from 'ramda/src/concat'
import take from 'ramda/src/take'
import merge from 'ramda/src/merge'

const undoable = (kind) => {

  const init = () => {
    return {
      list: [kind.init()],
      time: 0
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'undo':
        return evolve({
          time: dec
        }, state)
      case 'redo':
        return evolve({
          time: inc
        }, state)
      case 'child':
        // when we have a child action, we need to wipe out all future states
        // an replace with the next state.
        const past = take(state.time, state.list)
        const current = state.list[state.time]
        const next = kind.update(current, action.action)
        return merge(state, {
          list: concat(past, [current, next]),
          time: state.time + 1
        })
      default:
        console.warn('Unknown action:', action)
        return state
    }
  })

  const declare = curry((dispatch, state) => {
    const childDispatch = (action) => dispatch({type: 'child', action})
    const canUndo = state.time > 0
    const canRedo = state.time < state.list.length - 1
    return {
      html:
        h('div.undoable', [
          h('button.undo', {
            disabled: !canUndo,
            onClick: () => canUndo ? dispatch({type: 'undo'}) : null
          }, 'undo'),
          h('button.redo', {
            disabled: !canRedo,
            onClick: () => canRedo ? dispatch({type: 'redo'}) : null
          }, 'redo'),
          kind.declare(childDispatch, state.list[state.time]).html
        ])
    }
  })

  return {init, update, declare}

}

// let start it up!
start(undoable(counter), [render])
