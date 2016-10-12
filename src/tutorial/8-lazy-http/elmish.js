import partial from './partial'

// fixed arity of 2
const partial2 = fn => (a, b) => partial(fn)(a, b)

const mapPayload = partial((type, payload, ...args) => {
  return {
    type,
    payload: payload(...args),
  }
})

export const forward = partial((dispatch, key, type, payload) => {
  if (typeof payload === 'function') {
    return dispatch(key, mapPayload(type, payload))
  } else {
    return dispatch(key, {type, payload})
  }
})

const configure = drivers => app => {
  const dispatch = partial2((type, payload, ...args) => {
    if (typeof payload === 'function') {
      update({type, payload: payload(...args)})
    } else {
      update({type, payload})
    }
  })
  let state = app.init()
  const listeners = drivers.map(d => d(app, dispatch))
  function update(action) {
    state = app.update(state, action)
    listeners.forEach(l => l(state))
  }
  listeners.forEach(l => l(state))
}

export default configure
