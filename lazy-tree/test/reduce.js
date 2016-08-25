import test from 'ava'
import n from '../src/node'
import thunk from '../src/thunk'
import reduce from '../src/reduce'

test('reduces a non-lazy tree', t => {
  const add = (a, b) => ({count: a.count + b.count})
  const tree = n({count: 1}, [
    n({count: 2}),
    n({count: 3}),
  ])
  const result = reduce(add, undefined, tree)
  t.deepEqual(result.result, {count: 6})
})

test('reduces a lazy tree', t => {
  const add = (a, b) => ({count: a.count + b.count})
  const count = (c, l) => n({count: c}, l)
  const z = (c, l) => thunk(count, c, l)
  const tree = z(1, [
    z(2),
    z(3),
  ])
  const result = reduce(add, undefined, tree)
  t.deepEqual(result.result, {count: 6})
})

test('lazily does not recompute', t => {
  let merges = 0
  const add = (a, b) => {
    merges += 1
    return {count: a.count + b.count}
  }
  const count = (c, l) => n({count: c}, l)
  const z = (c, l) => thunk(count, c, l)
  const tree = z(1, [
    z(2),
    z(3),
  ])
  const result = reduce(add, undefined, tree)
  t.deepEqual(result.result, {count: 6})
  t.is(merges, 2)
  // reset
  merges = 0
  const tree2 = z(1, [
    z(2),
    z(3),
  ])
  const result2 = reduce(add, result, tree2)
  t.deepEqual(result2.result, {count: 6})
  t.is(merges, 0)
})
