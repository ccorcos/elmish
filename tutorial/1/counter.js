import curry    from 'ramda/src/curry'
import h        from 'react-hyperscript'
import flyd     from 'flyd'
import start    from 'src/elmish'
import ReactDOM from 'react-dom'

// init : () -> state
const init = () => 0

// update : (state, action) -> state
const update = curry((state, action) => {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state -1
    default:
      console.warn("Unknown action", action)
      return state
  }
})

// effects : (dispatch, state) -> fx
const effects = curry((dispatch, state) => {
  const inc = () => dispatch({type: 'increment'})
  const dec = () => dispatch({type: 'decrement'})
  return h('div.counter', [
    h('button.dec', {onClick: dec}, '-'),
    h('span.count', state),
    h('button.inc', {onClick: inc}, '+')
  ])
})

const app = {init, update, effects}

const streams = start(app)

const render = (html) => ReactDOM.render(html, document.getElementById('root'))
flyd.on(render, streams.effect$)
