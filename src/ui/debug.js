import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import evolve from 'ramda/src/evolve'
import append from 'ramda/src/append'
import inc from 'ramda/src/inc'
import omit from 'ramda/src/omit'

import h from 'react-hyperscript'

import concatEffects from 'elmish/src/utils/concatEffects'
import clamp from 'elmish/src/utils/clamp'

// inline styles are great
// https://speakerdeck.com/vjeux/react-css-in-js
const styles = {
  panel: {
    transition: 'transform 0.2s ease-in-out',
    transform: 'translate3d(0, 0, 0)',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'transparent',
    height: 30,
    maxWidth: 500,
    margin: '10px auto',
    display: 'flex',
    flexDirection: 'row'
  },
  input: {
    flex: 1,
    marginLeft: 10,
    outline: 'none'
  },
  label: {
    flex: '0 0 2em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    flex: '0 0 30px',
    outline: 'none',
    border: 0,
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0
  },
  svg: {
    height: 30,
    width: 30
  },
  hidden: {
    transform: 'translate3d(0, 50px, 0)'
  }
}

// could have used the react-svg-loader instead ;)
// https://github.com/boopathi/react-svg-loader
const svgs = {
  pause:
    h('svg', {style: styles.svg, viewBox: "0 0 30 30"},
      h('g', [
        h('rect', {x:9, y:4, width:5, height:22}),
        h('rect', {x:17, y:4, width:5, height:22})
      ])
    ),
  play:
    h('svg', {style: styles.svg, viewBox: "0 0 30 30"},
      h('path', {
        d: "M26.5,15.5 L7.5,27.5 L7.5,3.5 L26.5,15.5 L26.5,15.5 Z"
      })
    ),
}

const button = (name, props) => {
  return h(`button.${name}`, props, svgs[name])
}

const debug = (app) => {

  const init = () => {
    return {time: 0, states:[app.init()], live: true, hidden: false }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'play':
        return merge(state, {
          live: true,
          states: state.states.slice(0, state.time + 1)
        })
      case 'pause':
        return merge(state, {
          live: false
        })
      case 'set_time':
        return merge(state, {
          live: false,
          time: action.time
        })
      case 'inc':
        return merge(state, {
          live: false,
          time: clamp(0, state.states.length -1, state.time + 1)
        })
      case 'dec':
        return merge(state, {
          live: false,
          time: clamp(0, state.states.length -1, state.time - 1)
        })
      case 'child_action':
        if (state.live) {
          return evolve({
            time: inc,
            states: append(app.update(state.states[state.time], action.action))
          }, state)
        } else {
          return state
        }
      case 'toggle': {
        return merge(state, {
          hidden: !state.hidden
        })
      }
      default:
        return state
    }
  })

  const declare = curry((dispatch, state) => {
    const toggle = (state.live ? 'pause' : 'play')
    const childDispatch = (state.live ? (action) => dispatch({type: 'child_action', action}) : () => {})
    const effects = app.declare(childDispatch, state.states[state.time])

    const html =
      h('div.debug', [
        h('div.app', {}, effects.html),
        h('div.panel' + (state.hidden ? '.hidden' : ''), {
          style: state.hidden ? merge(styles.panel, styles.hidden) : styles.panel
        }, [
          button(toggle, {
            style: styles.button,
            onClick: () => dispatch({type: toggle})
          }),
          h('input', {
            type: 'range',
            className: 'with-hotkeys',
            style: styles.input,
            min: 0,
            max: state.states.length - 1,
            value: state.time,
            onChange: (e) => dispatch({type: 'set_time', time: Number(e.target.value)})
          }),
          h(`label`, {style: styles.label}, state.time)
        ])
      ])

    const hotkeys = [{
      'control d': () => dispatch({type: 'toggle'}),
      'left': () => dispatch({type: 'dec'}),
      'right': () => dispatch({type: 'inc'}),
      'space': () => state.live ? dispatch({type:'pause'}) : dispatch({type: 'play'})
    }]

    if (state.live) {
      return concatEffects({html, hotkeys}, omit(['html'], effects))
    } else {
      return {html, hotkeys, route: effects.route}
    }
  })

  return {init, declare, update}
}

export default debug
