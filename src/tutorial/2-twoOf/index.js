import React from 'react'
import start from './elmish'
import Counter from './counter'

const twoOf = kind => ({
  init: () => ({
    one: kind.init(),
    two: kind.init(),
  }),
  update: (state, action) => {
    if (action.type === 'one') {
      return {
        one: kind.update(state.one, action.action),
        two: state.two,
      }
    }
    if (action.type === 'two') {
      return {
        one: state.one,
        two: kind.update(state.two, action.action),
      }
    }
  },
  view: (dispatch, state) => (
    <div>
      {kind.view(action => dispatch({type: 'one', action}), state.one)}
      {kind.view(action => dispatch({type: 'two', action}), state.two)}
    </div>
  ),
})

start(twoOf(Counter))
// start(twoOf(twoOf(Counter)))
