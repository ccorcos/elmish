import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'
import without from 'ramda/src/without'
import map     from 'ramda/src/map'
import pipe    from 'ramda/src/pipe'

// There are three pages, red, green, and blue.
const colors = ['red', 'green', 'blue']

// render a page of some color with buttons to route to the other pages.
const page = (color, go) => {

  const style = {
    backgroundColor: color,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const makeButton = (c) => {
    return h(`button.${c}`, {
      style: {textAlign: 'center'},
      onClick: () => go(`/${c}`)
    }, c)
  }

  const buttons = pipe(
    without([color]),
    map(makeButton)
  )(colors)

  return (
    h(`div.${color}`, {style}, buttons)
  )
}

// A stateless component that hooks up to a basic routing history.
const init = () => {
  return {}
}

const update = (state, action) => {
  return state
}

const declare = (dispatch, state, {path, go}) => {
  const color = path.match(/^\/(.*)$/)[1] || colors[0]
  return {
    html: page(color, go),
    hotkeys: {
      'r': () => go('/red'),
      'g': () => go('/green'),
      'g': () => go('/blue')
    }
  }
}

export default {init, update, declare}
