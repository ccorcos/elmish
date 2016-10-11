import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'
import not     from 'ramda/src/not'
import evolve  from 'ramda/src/evolve'
import filter  from 'ramda/src/filter'
import append  from 'ramda/src/append'
import sum     from 'ramda/src/sum'
import map     from 'ramda/src/map'
import add     from 'ramda/src/add'
import pipe    from 'ramda/src/pipe'
import always  from 'ramda/src/always'

import {easeInOutQuad} from 'tween-functions'

const trackWidth = 300
const trackHeight = 50
const slideWidth = trackWidth - trackHeight

const init = () => {
  return {
    right: false,
    animations: [],
  }
}

const unfinished = (a) => {
  return a.time < a.duration
}

const addDt = curry((dt, a) => {
  return evolve({
    time: add(dt)
  }, a)
})

const update = curry((state, action) => {
  switch (action.type) {
    case 'toggle': 
      return evolve({
        right: not,
        animations: append({
          time: 0,
          duration: 1000,
          // if its on the right and going to be left, we want the easing function
          // to represent the distance from where it should be which is +trackWidth until 0.
          // if its on the left and going to be right, its -trackWidths til 0
          endpoints: state.right ? [slideWidth, 0] : [-slideWidth, 0]
        }),
      }, state)
    case 'tick':
      return evolve({
        animations: pipe(
          map(addDt(action.dt)),
          filter(unfinished)
        )
      }, state)
    default:
      return state
  }
})

const declare = curry((dispatch, state) => {

  const getProgress = (a) => {
    return easeInOutQuad(a.time, a.endpoints[0], a.endpoints[1], a.duration)
  }

  const dx = sum(map(getProgress, state.animations))

  const styles = {
    slider: {
      width: trackWidth, 
      height: trackHeight, 
      border: '1px solid black'
    },
    handle: {
      width: trackHeight, 
      height: trackHeight, 
      backgroundColor: 'grey', 
      transform: `translate3d(${dx + (state.right ? slideWidth : 0)}px, 0, 0)`
    }
  }

  const toggle = () => dispatch({type: 'toggle'})
  const tick = (dt) => dispatch({type: 'tick', dt})

  return {
    html:
      h('div.app', [
        h('button.toggle', { onClick: toggle }, 'toggle'),
        h('div.slider', { style: styles.slider }, [
          h('div.handle', { style: styles.handle })
        ])
      ]),
    hotkeys: [{
      't': toggle
    }],
    raf: state.animations.length == 0 ? [] : [ tick ],
    toggle: [ toggle ]
  }
})

export default {init, declare, update}