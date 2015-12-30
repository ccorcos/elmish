import flyd from 'flyd'

import prop from 'ramda/src/prop'
import last from 'ramda/src/last'
import pipe from 'ramda/src/pipe'
import contains from 'ramda/src/contains'

import raf  from 'raf'

import batchWhen from 'elmish/src/utils/batchWhen'

// There may be multiple animations going on at the same time. So
// we want to throttle the effects / rendering while we batch compute
// all the tick actions.

const animator = (effect$, throttle$) => {

  const raf$ = pipe(
    flyd.map(prop('raf')),
    flyd.map(rafs => rafs ? rafs : [])
  )(effect$)

  // when we get a new animation request, start batching
  // animation requests while we request a frame
  const batch$ = flyd.combine((raf$, self) => {
    if (self() !== true) {
      self(true)
      raf(() => self(false))
    }
  }, [raf$])

  // lets keep track of the last two times so we can calculate
  // change in time for the animation frame
  const time$ = flyd.scan((acc, value) => {
    return [acc[1], Date.now()]
  }, [0, 0], batch$)

  // whenever we're done batching, we can compute the dt from
  // start to finish of the raf.
  const dt$ = flyd.combine((time$, self) => {
    if (batch$() === false) {
      const [x1, x2] = time$()
      self(x2-x1)
    }
  }, [time$])

  // when we get a tick from raf, lets get the lastest
  // declarative raf tick requests
  const ticks$ = pipe(
    batchWhen(batch$),
    flyd.map(last)
  )(raf$)

  // both ticks$ and dt$ depend on batch$ so we need to combine
  // them to make sure both are computed by the time we get here.
  // but we only want to fire the ticks when ticks$ changes.
  flyd.combine((ticks$, dt$, self, changed) => {
    if (contains(ticks$, changed)) {
      const ticks = ticks$()
      const dt = dt$()
      // lets throttle the effects$ so we don't overcompute
      throttle$(true)
      ticks.map(tick => tick(dt))
      throttle$(false)
    }
  }, [ticks$, dt$])
}

export default animator