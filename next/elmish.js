/*
init    : () -> state
update  : (state, action) -> state
effects : (action, state) -> {html, http}
*/

import flyd  from 'flyd'

const start = ({init, view, update}) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(update, init(), action$)
  const effect$ = flyd.map(view(action$), state$)
  return {action$, state$, effect$}
}

export default start
