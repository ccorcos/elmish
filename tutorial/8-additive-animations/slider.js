/*
Animations are tricky. They're inherently procedural which makes it difficult
to think about them declaratively. CSS does a decent job with this, but CSS
animations lack in a few crucial ways.

(1) its hard to build complex animations without losing your mind

(2) when you change a CSS animation during the animation, you will see a sudden
discontinuity and as the animation switches. This is because CSS animations are
descructive. You'll notice that weird things start to happen if you spam them.

Right now, I want to focus on that second point. "Additive animations" is a
pretty simple concept that was introduced by Apple in iOS 8 in which the
the default way of handling animations that happen at the same time isn't to
destroy the animations but to actually add their offsets. This ensures that
there is never a moment of discontinuity. Here's a cool demo of what I'm talking
about:

https://rawgit.com/chenglou/react-tween-state/master/examples/index.html

So in this tutorial, I'll show you how to use the requestAnimationFrame (raf)
service to build your own javascript additive animations.
*/

import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import not from 'ramda/src/not'
import evolve from 'ramda/src/evolve'
import filter from 'ramda/src/filter'
import append from 'ramda/src/append'
import sum from 'ramda/src/sum'
import map from 'ramda/src/map'
import add from 'ramda/src/add'
import pipe from 'ramda/src/pipe'

import h from 'react-hyperscript'

// `tween-functions` is a simple library for computing animations along
// bezier curves: https://github.com/chenglou/tween-functions
import {easeInOutQuad} from 'tween-functions'

// for now, we'll hardcode the width and height of the slider.
const trackWidth = 300
const trackHeight = 50
// the handle will be a square, so it won't slide the entire trackWidth.
const slideWidth = trackWidth - trackHeight

// we'll keep track of the animations in an array so we can compute their
// progress and add them together. we'll also keep track of which side we're
// toggled to.
const init = () => {
  return {
    right: false,
    animations: [],
  }
}

/*
An animation consists of 3 basic properties:
- `time` denotes the progress of the animations.
- `duration` denotes the total duration of the animation.
- `dx` denotes the initial offset of the animation.

`dx` is meant to be understood as ∆x, or the change in x. Rather than specify
an animation to be from one endpoint to another endpoint, like `[0, slideWidth]`
and `[slideWidth, 0]`, we want to specify its initial offset from the target
position. For example, if the current state is `{right: false}` and we want to
toggle the slider, then when `{right: true}`, the position of the slider will be
`slideWidth`. Thus the initial offset of the animation is `-slideWidth` and will
animation to `0`. The opposite is true as well. If the current state is
`{right: true}` and we toggle the slider, then the position of the slider will need
to be initially offset by `slideWidth` and animated to `0` to ensure continuity.

There are a couple benefits of using dx as opposed to keeping track of each endpoint.
For one, it can get really confusing thinking about the endpoints of the animation
when we're toggling the offset based on the `right` property of the state. Where's
the beginning and wheres the end? The other benefit is that we can now trivially add
up all of these offsets and get really smooth animations as we spam the slider
animation.
*/

const unfinished = (a) => a.time < a.duration

// increment the time of each animation with ∆t
const addDt = curry((dt, a) => {
  return evolve({
    time: add(dt)
  }, a)
})

const update = curry((state, action) => {
  switch (action.type) {
    case 'toggle':
      // append an animation and toggle the state
      return evolve({
        right: not,
        animations: append({
          time: 0,
          duration: 1000,
          dx: state.right ? slideWidth : -slideWidth
        }),
      }, state)
    case 'tick':
      // on a tick action, we're going to progress each animation
      // and filter out any animations that are finished.
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

  // using an easing function, we can compute the progress of each animation
  const compute = (a) => easeInOutQuad(a.time, a.dx, 0, a.duration)
  // then simply add up all the ∆x's
  const dx = sum(map(compute, state.animations))

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
      // set the transform property
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
    // raf is a service that uses requestAnimationFrame to dispatch callback ticks.
    // each callback will have a ∆t that's elapsed in the animation. This is
    // convenient so we can pause and play animations in the middle of running them.
    // There is another trade-off here. Since we're not using absolute time, the ∆t
    // can end up being longer if theres lots of computation. In between ticks. This
    // usually results in a longer duration, but still no jank which is pretty neat.
    raf: state.animations.length == 0 ? [] : [ tick ],
  }
})

export default {init, declare, update}