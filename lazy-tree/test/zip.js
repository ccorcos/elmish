import test from 'ava'
import {zip} from '../src/utils'

test('equal size lists', t => {
  t.deepEqual(
    zip([1, 2, 3], [4, 5, 6]),
    [[1, 4], [2, 5], [3, 6]]
  )
})

test('first list is larger', t => {
  t.deepEqual(
    zip([1, 2, 3, 4], [4, 5, 6]),
    [[1, 4], [2, 5], [3, 6], [4, undefined]]
  )
})

test('second list is larger', t => {
  t.deepEqual(
    zip([1, 2, 3], [4, 5, 6, 7]),
    [[1, 4], [2, 5], [3, 6], [undefined, 7]]
  )
})
