import h from 'react-hyperscript'
import curry from 'ramda/src/curry'

const init = () => ({count: 0})

const update = curry((state, action) => {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1}
    case 'decrement':
      return {count: state.count - 1}
    default:
      console.warn("Unknown action:", action)
      return state
  }
})

const declare = curry((dispatch, state) => {
  const inc = () => dispatch({type: 'increment'})
  const dec = () => dispatch({type: 'decrement'})
  return {
    html:
      h('div.counter', [
        h('button.dec', {onClick: dec}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: inc}, '+')
      ])
  }
})

export default {init, update, declare}
