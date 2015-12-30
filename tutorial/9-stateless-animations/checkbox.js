/*
In the previous example, the component was in control of itself so it could
trigger animations whenever it was toggled. But it gets a little trickier
when you want to animate a stateless component. For example, a toggle switch
like a checkbox will typically get a value of true or false as props. If you
want to animate this transition, it gets a little trickier. The "stateless"
component will now have to carry the state of its own animation and keep in
sync with its props. Thus, the component is no longer statless. But I still
like to consider it stateless because it gets its state as props in its parent's
`init` and declare` rather than in `update` which would get really ugly.
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

// a lot of the animation code can be reused, so I've build some helper
// functions to do all the heavy lifting for you.
import animation from 'elmish/src/animation'

// we'll use chroma.js to animate color as well.
// http://gka.github.io/chroma.js/
import chroma from 'chroma-js'

const init = (value=true) => {
  return {
    value,
    animations: animation.init(),
  }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'toggle':
      // we'll specify dx as a percentage this time
      const dx = state.value ? 1 : -1
      // using animation.start to append a new animation
      return evolve({
        value: not,
        animations: animation.start('easeInOutQuad', 250, dx)
      }, state)
    case 'tick':
      // using animation.tick to tick the animations
      return evolve({
        animations: animation.tick(action.dt)
      })(state)
    default:
      return state
  }
})

const declare = curry((dispatch, state, {value, onChange, width=60}) => {

  // Now things get a little tricky. What if the parent component
  // wants this component to be displayed as true, but state.value
  // is false? Well, we just want to requestAnimationFrame and begin
  // animating to the new value!
  const toggle = (dt) => dispatch({type:'toggle', dt})
  const tick = (dt) => dispatch({type:'tick', dt})
  const raf = (state.value !== value) ? [ toggle ] :
              (state.animations.length > 0) ? [ tick ] : []

  // I'm making this switch look a lot like the iOS9 switches
  const green = [66, 210, 80]
  const height = width/1.8
  const slideWidth = width - height
  // compute the ∆x total for all the animations
  const dx = animation.compute(state.animations)*slideWidth
  const offset = (state.value ? slideWidth : 0) + dx
  // use chroma.js to create a color scale to animate over
  const colorScale = chroma.scale(['white', green]).mode('lab').domain([0, slideWidth])
  const styles = {
    checkbox: {
      width: width,
      height: height,
      border: '1px solid #ccc',
      borderRadius: width,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colorScale(offset)
    },
    handle: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: height,
      height: height,
      borderRadius: height,
      border: '1px solid #ccc',
      backgroundColor: 'white',
      transform: `translate3d(${offset}px, 0, 0)`,
      margin: -1
    }
  }

  // onClick, we want to trigger onChange as if it were a real checkbox
  const click = () => onChange({target: {value: !value}})

  return {
    html:
      h('div.checkbox', {style: styles.checkbox, onClick: click}, [
        h('div.handle', { style: styles.handle })
      ]),
    raf: raf
  }
})

export default {init, declare, update}