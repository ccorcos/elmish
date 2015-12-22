// This is the simplest example of a general user interface pattern I will be
// showing you. It is wholely inspired by the Elm Architecture:
// https://github.com/evancz/elm-architecture-tutorial/

// This is a simple counter app that uses React as a declarative rendering
// "service". A service takes some declarative structure and does a bunch of
// nasty mutations and side-effects that we want to hide from the main logic
// of the application.
import React from 'react'
import ReactDOM from 'react-dom'

// The timplest UI component consists of 3 pure, side-effect-free functions
// with the following type signatures:
//
// init : () => state
// update : state => action => state
// view : dispatch => state => html

// the initial state of the counter is 0
// init : () => state
const init = () => 0

// `update` takes the current state and an action, and returns a new state.
// This counter has two actions, increment and decrement.
// update : state => action => state
const update = (state, action) => {
  switch (action) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    default:
      console.warn("Unknown action:", action)
      return state
  }
}

// `dispatch` is a function that accepts actions that will be passed to `update`
// `view` returns a react component that sends actions to dispatch.
// dispatch : action => ()
// view : dispatch => state => html
const view = (dispatch, state) => {
  const inc = () => dispatch('increment')
  const dec = () => dispatch('decrement')
  return (
    <div>
      <button onClick={dec}>-</button>
      <span>{state}</span>
      <button onClick={inc}>+</button>
    </div>
  )
}

const app = {init, update, view}
const root = document.getElementById('root')

// now we just need to connect the pieces.
let state = app.init()
// when we get an action, we want to update the state and re-render the ui
const dispatch = action => {
  state = app.update(state, action)
  ReactDOM.render(app.view(dispatch, state), root)
}
// the initial render
ReactDOM.render(app.view(dispatch, state), root)

// that's it! get it running with: `npm i && node server.js`
