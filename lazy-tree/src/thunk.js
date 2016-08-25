import {zip} from './utils'

// this function returns a partially applied function but keeps track of the
// original function and the arguments so you can compare them
export default function thunk(fn, ...args) {
  const _fn = (...more) => fn.apply(null, args.concat(more))
  _fn.__type = 'thunk'
  if (fn.__type === 'thunk') {
    _fn.fn = fn.fn
    _fn.args = fn.args.concat(args)
  } else {
    _fn.fn = fn
    _fn.args = args
  }
  return _fn
}

// this function will compare two thunks with a predicate for comparing
// the function arguments
export function compare(pred) {
  function equals(fn1, fn2) {
    if (!fn1 || !fn2) {
      return false
    } else if (fn1.fn !== fn2.fn) {
      // compare the functions
      return false
    } else {
      // compare the arguments
      return zip(fn1.args, fn2.args)
        .map(([a, b]) => (a && a.__type === 'thunk') ? equals(a, b) : pred(a, b))
        .reduce((a, b) => a && b, true)
    }
  }
  return equals
}
