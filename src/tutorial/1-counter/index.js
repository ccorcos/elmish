import React from 'react'
import ReactDOM from 'react-dom'

const Counter = {
  init: () => 0,
  update: (state, action) => state + action,
  view: (dispatch, state) => (
    <div>
      <button onClick={() => dispatch(-1)}>{'-'}</button>
      <span>{state}</span>
      <button onClick={() => dispatch(+1)}>{'+'}</button>
    </div>
  ),
}

const start = app => {
  const root = document.getElementById('root')
  let state = app.init()
  const dispatch = action => {
    state = app.update(state, action)
    ReactDOM.render(app.view(dispatch, state), root)
  }
  ReactDOM.render(app.view(dispatch, state), root)
}

start(Counter)
