import R from 'ramda'

// when partially applying functions, we keep track of the original function and
// the arguments so we can provide a .equals function.
const bind = (fn, ...args) => {
  const _fn = (...more) => R.apply(fn, R.concat(args, more))
  _fn.fn = fn
  _fn.args = args
  _fn.equals = (fn2) => R.equals(fn2.fn, _fn.fn) && R.equals(fn2.args, _fn.args)
  return _fn
}

// forward action to dispatch method tagged with a certain type
// e.g. forward(d, 'counter1')
const _forward = (dispatch, type, action) => dispatch({type, action})
const forward = (dispatch, type) => bind(forward, dispatch, type)

// route actions based
const route = (obj) => (s,a) =>
  R.evolve({
    [a.type]: obj[a.type](s[a.type], a.action)
  }, s)

const e = {bind, forward}
