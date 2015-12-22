// This next example will introduce to you some more functional concepts and
// the first step generalizing this ui component pattern.
import flyd from 'flyd'
import React from 'react'
import ReactDOM from 'react-dom'

// A component's state will typically be an object since they're rarely as
// simple as a counter.
const init = () => ({count: 0})

// Actions will typically be an object with a type so you can pass
// more information along in a more complicated component. Hence switching
// on the type.
const update = (state, action) => {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1}
    case 'decrement':
      return {count: state.count - 1}
    default:
      console.warn("Unknown action:", action)
      return state
  }
}

// We will use a concept called function currying where a function takes one
// argument at a time, returning a function to recieve the next argument until
// it gets the last argument and returns the result. This will come in handy
// soon.
const view = dispatch => state => {
  const inc = () => dispatch({type: 'increment'})
  const dec = () => dispatch({type: 'decrement'})
  return (
    <div>
      <button onClick={dec}>-</button>
      <span>{state.count}</span>
      <button onClick={inc}>+</button>
    </div>
  )
}

const app = {init, update, view}
const root = document.getElementById('root')

// We'll use streams to handle all the pumbing this time so we can code more
// declaratively. By convention, we'll denote streams by ending with $.
// We'll start with a stream of actions.
// flyd is a simple an elegant observable streams library:
// https://github.com/paldepind/flyd
const action$ = flyd.stream()
// Whenever we get a new action, we'll run update with the previous state.
// flyd.scan works a lot like Array.reduce but on streams.
const state$ = flyd.scan(app.update, app.init(), action$)
// Now we have a stream of states. On every new state, we'll get the virtual
// DOM tree from the app.view function. Any async calls to dispatch will
// be routed back to the action stream.
const html$ = flyd.map(view(action$), state$)
// Then we pipe the virtual DOM stream to ReactDOM.render.
const render = html => ReactDOM.render(html, root)
flyd.on(render, html$)

// A couple things to take note of here.
// - We didn't have to define any variables with `var` or `let`. This means our
//   code is nice and declarative. :)
// - The view function creates a declarative data structure to handle all async
//   side-effects. We'll eventually handle other side-effects here as well.
