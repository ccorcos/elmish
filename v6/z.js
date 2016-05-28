import R from 'ramda'

// import * as Z from 'z'

 // partially apply a function with some arguments.
 // returned function has a .equals function for comparison.
 // this is what I call "partially applied function equality" (PAFE)
export const partial = (fn, ...args) => {
  let _fn = (...more) => {
    return R.apply(fn, R.concat(args, more))
  }
  _fn.fn = fn
  _fn.args = args
  _fn.equals = (fn2) => {
    return R.equals(fn2.fn, _fn.fn) &&
           R.equals(fn2.args, _fn.args)
  }
  return _fn
}

// a simple pipe function.
// list of functions in an array.
// first function can be variadic.
const _pipe = (fns, ...args) => {
  const head = R.head(fns)
  const tail = R.tail(fns)
  const applyNextFn = (arg, fn) => fn(arg)
  return R.reduce(applyNextFn, head(...args), tail)
}

// parially apply to _pipe so we can pipe while maintaining PAFE
export const pipe = (fns) => {
  return partial(_pipe, fns)
}


// create create an action and dispatch it
const _forward = (dispatch, type, payload) => {
  return dispatch({type, payload})
}

// useful for forwarding dispatch functions to children while maintaing
// PAFE so we react component can render lazily.
export const forward = (dispatch, type) => {
  return partial(_forward, dispatch, type)
}
