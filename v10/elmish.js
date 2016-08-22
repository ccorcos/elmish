import R from 'ramda'
import flyd from 'flyd'
import ReactDOM from 'react-dom'

const isString = (x) => Object.prototype.toString.apply(x) === '[object String]'
const isNumber = (x) => Object.prototype.toString.apply(x) === '[object Number]'
const isObject = (x) => Object.prototype.toString.apply(x) === '[object Object]'
const isArray = (x) => Object.prototype.toString.apply(x) === '[object Array]'
const isFunction = (x) => Object.prototype.toString.apply(x) === '[object Function]'

const addPrefix = R.add
const addSuffix = R.flip(R.add)
const startsWith = R.curry((q, str) => str.startsWith(q))
const endsWith = R.curry((q, str) => str.endsWith(q))
const stripl = R.curry((q, str) => startsWith(q, str) ? str.slice(q.length) : str)
const stripr = R.curry((q, str) => endsWith(q, str) ? str.slice(0, str.length - q.length) : str)
const strip = R.curry((q, str) => stripl(q, stripr(q, str)))

const lensIdentity = R.lens(R.identity, R.identity)
const lensWhereEq = (obj) => {
  const pred = R.whereEq(obj)
  return R.lens(
    (list) => R.find(pred, list),
    (value, list) => R.map(x => pred(x) ? value : x, list)
  )
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
      R.join(''),
    )(path)
  } else {
    throw new TypeError(`Unknown path: ${path}`)
  }
}

// console.log(makeActionPrefix(['list', {id: 10}, 'state']))

const makeStateLens = (path) => {
  if (isString(path)) {
    return R.lensProp(path)
    } else if (isNumber(path)) {
    return R.lensIndex(path)
  } else if (isObject(path)) {
    return lensWhereEq(path)
  } else if (isArray(path)) {
    return R.reduce(
      (l, p) => R.compose(l, makeStateLens(p)),
      lensIdentity,
      path
    )
  }
}

// console.log(
//   R.view(
//     // R.compose(R.lensProp('list'), R.lensIndex(0)),
//     makeStateLens(['list', 0]),
//     {list: [{id:1, state: 1}]}
//   )
// )

// console.log(
//   R.set(
//     // R.compose(R.lensProp('list'), R.lensIndex(0), R.lensProp('state')),
//     makeStateLens(['list', 0, 'state']),
//     2,
//     {list: [{id:1, state: 1}]}
//   )
// )

// console.log(
//   R.view(
//     makeStateLens(['list', {id: 1}, 'state']),
//     {list: [{id:1, state: 1}]}
//   )
// )


export const start = (app) => {
  const event$ = flyd.stream()
  const state$ = flyd.scan(
    (state, {action, payload}) => app.update(state, action, payload),
    app.init(),
    event$
  )
  const dispatch = (action, payload) => (...args) =>
    isFunction(payload) ? event$({action, payload: payload(...args)}) : event$({action, payload})
  const html$ = flyd.map(state => app.view(dispatch, state), state$)
  const root = document.getElementById('root')
  flyd.on(html => ReactDOM.render(html, root), html$)
}

export const lift = (path, obj) => {
  const prefix = makeActionPrefix(path)
  const lens = makeStateLens(path)
  return {
    ...obj,
    // this may be useful for debugging later
    path: path.concat(obj.path || []),
    // nest the state
    init: (state) => {
      return R.set(
        lens,
        obj.init(
          R.view(lens, state)
        ),
        state
      )
    },
    // unprefix action and update nested state
    update: (state, action, payload) => {
      if (startsWith(prefix, action)) {
        return R.over(
          lens,
          s => obj.update(
            s,
            stripl(prefix, action),
            payload
          ),
          state
        )
      } else {
        return state
      }
    },
    // prefix actions and pass on nested state
    view: (dispatch, state, props) => {
      return obj.view(
        (action, payload) => dispatch(addPrefix(prefix, action), payload),
        R.view(lens, state),
        props
      )
    }
  }
}
