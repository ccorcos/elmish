/*
init    : () -> state
update  : (state, action) -> state
effects : (action, state) -> {html, http}
*/

import flyd  from 'flyd'

const start = ({init, view, update}) => {
  const action$ = flyd.stream()
  const model$ = flyd.scan(update, init(), action$)
  const effect$ = flyd.map(view(action$), model$)
  return {action$, model$, effect$}
}

export default start
