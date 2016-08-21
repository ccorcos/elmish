import R from 'ramda'

const isString = (x) =>
  Object.prototype.toString.apply(x) === '[object String]'

const isNumber = (x) =>
  Object.prototype.toString.apply(x) === '[object Number]'

const isObject = (x) =>
  Object.prototype.toString.apply(x) === '[object Object]'

const isArray = (x) =>
  Object.prototype.toString.apply(x) === '[object Array]'

const addPrefix = R.add
const addSuffix = R.flip(R.add)
const startsWith = R.curry((q, str) => str.startsWith(q))
const endsWith = R.curry((q, str) => str.endsWith(q))
const stripl = R.curry((q, str) => startsWith(q, str) ? str.slice(q.length) : str)
const stripr = R.curry((q, str) => endsWith(q, str) ? str.slice(0, str.length - q.length) : str)
const strip = R.curry((q, str) => stripl(q, stripr(q, str)))

const Component = (obj) => {
  return {
    ...obj,
    __type: 'Elmish.Component',
    path: [],
  }
}

// make action prefix for lifting actions
const makeActionPrefix = (path) => {
  if (isString(path) || isNumber(path)) {
    return `${path}/`
  } else if (isObject(path)) {
    return R.pipe(
      R.toPairs,
      R.map(R.join(':')),
      R.join(','),
      addSuffix('/')
    )(path)
  } else if (isArray(path)) {
    return R.pipe(
      R.map(makeActionPrefix),
      addSuffix('/')
    )(path)
  } else {
    throw new TypeError(`Unknown path: ${path}`)
  }
}

const lensWhereEq = (obj) => {
  const pred = R.whereEq(obj)
  return R.lens(
    (list) => R.find(pred, list),
    (value, list) => R.map(x => pred(x) ? value : x, list)
  )
}

const lensIdentity = R.lens(R.identity, R.identity)

const makeStateLens = (path) => {
  if (isString(path)) {
    return R.lensProp(path)
    } else if (isNumber(path)) {
    return R.lensIndex(path)
  } else if (isObject(path)) {
    return lensWhereEq(path)
  } else if (isArray(path)) {
    return R.reduce(
      (l, p) => R.compose(makeStateLens(p), l),
      lensIdentity,
      path
    )
  }
}

const lift = (path, obj) => {
  const prefix = makeActionPrefix(path)
  return {
    ...obj,
    // this may be useful for debugging later
    path: path.concat(obj.path)
    // nest the state
    init: {
      [key]: obj.state,
    },
    // unprefix action and update nested state
    update: (state, action, payload) => {
      if (startsWith(pre, action)) {
        return R.evolve({
          [key]: obj.update(state[key], stripl(pre, action), payload)
        }, state)
      } else {
        return state
      }
    },
    // prefix actions and pass on nested state
    view: (event, state, props) => {
      return obj.vzwiew(
        R.compose(event, prefix(pre)),
        state[key],
        props
      )
    }
  }
}

const Elmish = {
  Component,
  lift,
}
