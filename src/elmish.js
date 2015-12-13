/*
This is the heart of any elmish application which scans over actions to update
the state map to all the effects. It takes a single argument which is a UI
component consisting of the following function signatures:

init    : () -> state
update  : (state, action) -> state
effects : (dispatch, state) -> fx

It outputs three streams, a stream of actions, a stream of state, and a stream
of effects.
*/

import flyd  from 'flyd'

const start = ({init, effects, update}) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(update, init(), action$)
  const effect$ = flyd.map(effects(action$), state$)
  return {action$, state$, effect$}
}

export default start
