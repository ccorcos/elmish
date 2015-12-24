import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'
import not     from 'ramda/src/not'
import evolve  from 'ramda/src/evolve'
import filter  from 'ramda/src/filter'
import append  from 'ramda/src/append'
import sum     from 'ramda/src/sum'
import map     from 'ramda/src/map'
import always  from 'ramda/src/always'

import {easeInOutQuad} from 'tween-functions'

const trackWidth = 300
const trackHeight = 50
const slideWidth = trackWidth - trackHeight

const init = () => {
  return {
    right: false,
    animations: [],
    t: undefined
  }
}

const update = curry((state, action) => {
  const now = Date.now()
  switch (action.type) {
    case 'toggle': 
      return evolve({
        right: not,
        animations: append({
          init: now,
          duration: 1000,
          // if its on the right and going to be left, we want the easing function
          // to represent the distance from where it should be which is +trackWidth until 0.
          // if its on the left and going to be right, its -trackWidths til 0
          endpoints: state.right ? [slideWidth, 0] : [-slideWidth, 0]
        }),
        t: always(now)
      }, state)
    case 'tick':
      // keep time as part of the animation so we can
      return evolve({
        animations: filter(a => ((now - a.init) <= a.duration)),
        t: always(now)
      }, state)
    default:
      return state
  }
})

const declare = curry((dispatch, state) => {

  const getProgress = (a) => {
    return easeInOutQuad(state.t - a.init, a.endpoints[0], a.endpoints[1], a.duration)
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
  const tick = () => dispatch({type: 'tick'})

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
    raf: state.animations.length == 0 ? [] : [ tick ]
  }
})

export default {init, declare, update}