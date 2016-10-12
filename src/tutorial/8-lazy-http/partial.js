import R from 'ramda'
import { eq } from './utils'

// remember a function's arguments for comparison
const partial = fn => (...args) => {
  const _fn = (...more) => fn(...args.concat(more))
  _fn.fn = fn
  _fn.args = args
  _fn.equals = b => b
                 && eq(b.fn, _fn.fn)
                 && R.equals(b.args, _fn.args)
  return _fn
}

export default partial
