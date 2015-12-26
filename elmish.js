/*
This is the heart of any elmish application which scans over actions to update
the state map to all the effects. It takes a single argument which is a UI
component consisting of the following function signatures:

init : () => state
update : (state, action) => state
declare : (dispatch, state) => effects

Services simply listen to the effects$ and perform side-effects and mutations.
service : (effects) => ()
*/

import flyd from 'flyd'
import apply from 'ramda/src/apply'
import map from 'ramda/src/map'
import __ from 'ramda/src/__'
import throttleWhen from 'elmish/utils/throttleWhen'

const start = ({init, declare, update}, services=[]) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(update, init(), action$)
  const throttle$ = flyd.stream(false)
  const throttledState$ = throttleWhen(throttle$, state$)
  const effects$ = flyd.map(declare(action$), throttledState$)
  map(apply(__, [effects$, throttle$]), services)
  return {action$, state$, effects$}
}

export default start