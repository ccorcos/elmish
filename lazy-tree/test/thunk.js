import test from 'ava'
import thunk, {compare} from '../src/thunk'

test('partially applies a function', t => {
  const fn = (a, b) => a + b
  const lazy = thunk(fn, 1)
  const result = lazy(2)
  t.is(result, 3)
})

test('can be compared', t => {
  const fn = (a, b) => a + b
  const lazy1 = thunk(fn, 1)
  const lazy2 = thunk(fn, 1)
  const lazy3 = thunk(fn, 2)
  const equal = compare((a, b) => a === b)
  t.is(equal(lazy1, lazy2), true)
  t.is(equal(lazy1, lazy3), false)
})
