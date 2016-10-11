/*
This file contains some helper functions for working with non-CSS
animations and manually tweening animations using `tween-functions`.
*/

import tf from 'tween-functions'

import curry from 'ramda/src/curry'
import append from 'ramda/src/append'
import evolve from 'ramda/src/evolve'
import add from 'ramda/src/add'
import pipe from 'ramda/src/pipe'
import map from 'ramda/src/map'
import sum from 'ramda/src/sum'
import filter from 'ramda/src/filter'

// animations are just kept in an array in the component state.
export const init = () => []

// starting an animation simply appends an object to the animations
// list. all our animations are going to be additive so dx needs to
// be a offset that ends at zero.
export const start = curry((type, duration, dx, list) => {
  return append({time:0, type, duration, dx}, list)
})

const unfinished = (a) => {
  return a.time < a.duration
}

const addDt = curry((dt, a) => {
  return evolve({
    time: add(dt)
  }, a)
})

// on each tick, we need to update the animation state get rid of
// any animations that have finished.
export const tick = curry((dt, list) => {
  return pipe(
    map(addDt(dt)),
    filter(unfinished)
  )(list)
})

// simply adding up all the animations so we always have smooth
// transitions.
export const compute = (animations) => {
  const tween = ({time, dx, duration, type}) => tf[type](time, dx, 0, duration)
  return sum(map(tween, animations))
}

export default {init, start, tick, compute}