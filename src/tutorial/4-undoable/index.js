import React from 'react'
import start from '../2-twoOf/elmish'
import Counter from '../2-twoOf/counter'

const undoable = kind => ({
  init: () => ({
    time: 0,
    states: [kind.init()],
  }),
  update: (state, action) => {
    if (action.type === 'undo') {
      return {
        time: state.time - 1,
        states: state.states,
      }
    }
    if (action.type === 'redo') {
      return {
        time: state.time + 1,
        states: state.states,
      }
    }
    if (action.type === 'action') {
      return {
        time: state.time + 1,
        states: state.states.slice(0, state.time + 1).concat([
          kind.update(state.states[state.time], action.action),
        ]),
      }
    }
  },
  view: (dispatch, state) => {
    const canUndo = state.time > 0
    const canRedo = state.time < state.states.length - 1
    return (
      <div>
        <button onClick={() => dispatch({type: 'undo'})} disabled={!canUndo}>
          undo
        </button>
        <button onClick={() => dispatch({type: 'redo'})} disabled={!canRedo}>
          redo
        </button>
        {kind.view(
          action => dispatch({type: 'action', action}),
          state.states[state.time]
        )}
      </div>
    )
  },
})

start(undoable(Counter))
