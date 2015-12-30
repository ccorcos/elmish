
import curry from 'ramda/src/curry'
import append from 'ramda/src/append'
import evolve from 'ramda/src/evolve'
import add from 'ramda/src/add'
import pipe from 'ramda/src/pipe'
import map from 'ramda/src/map'
import sum from 'ramda/src/sum'
import filter from 'ramda/src/filter'
import tf from 'tween-functions'

export const init = () => []

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

export const tick = curry((dt, list) => {
  return pipe(
    map(addDt(dt)),
    filter(unfinished)
  )(list)
})

export const compute = (animations) => {
  const tween = ({time, dx, duration, type}) => tf[type](time, dx, 0, duration)
  return sum(map(tween, animations))
}

export default {init, start, tick, compute}