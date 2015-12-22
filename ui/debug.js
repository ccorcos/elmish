import h from 'react-hyperscript'
import assoc from 'ramda/src/assoc'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import evolve from 'ramda/src/evolve'
import append from 'ramda/src/append'
import inc from 'ramda/src/inc'
import omit from 'ramda/src/omit'
import concat from 'ramda/src/concat'
import mergeWith from 'elmish/utils/mergeWith'

const concatObjValues = mergeWith(concat)

import 'styles/debug.styl'

// could have used the react-svg-loader instead ;)
const svgs = {
  pause:
    h('svg', {viewBox: "0 0 30 30"},
      h('g', [
        h('rect', {x:9, y:4, width:5, height:22}),
        h('rect', {x:17, y:4, width:5, height:22})
      ])
    ),
  play:
    h('svg', {viewBox: "0 0 30 30"},
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
      case 'child':
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

  const toChildAction = (action) => {return {type: 'child', action}}

  const declare = curry((dispatch, state) => {
    const toggle = (state.live ? 'pause' : 'play')
    const childDispatch = (state.live ? (action) => dispatch({type: 'child', action}) : () => {})
    const effects = app.declare(childDispatch, state.states[state.time])

    const html =
      h('div.debug', [
        h('div.app', {}, effects.html),
        h('div.panel' + (state.hidden ? '.hidden' : ''), [
          button(toggle, {
            onClick: () => dispatch({type: toggle})
          }),
          h(`input`, {
            type: 'range',
            min: 0,
            max: state.states.length - 1,
            value: state.time,
            onChange: (e) => dispatch({type: 'set_time', time: Number(e.target.value)})
          }),
          h(`label`, {}, state.time)
        ])
      ])

    const hotkeys = [{
      'control d': () => dispatch({type: 'toggle'})
    }]

    if (state.live) {
      return concatObjValues({html, hotkeys}, omit(['html'], effects))
    } else {
      return {html, hotkeys}
    }
  })

  return {init, declare, update}
}

export default debug