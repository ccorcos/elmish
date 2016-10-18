import React from 'react'
import ReactDriver, { lazy } from './react'
import { eq, compare } from './utils'
import configure, {forward} from './elmish'

function node(value, children) {
  return {
    __type: 'node',
    value,
    children,
  }
}

function lazyNode(fn, ...args) {
  return {
    __type: 'lazyNode',
    fn,
    args,
  }
}

function reduceLazyTree(equals, reducer, prev, next) {
  // check if there is a previous computation so we can be lazy
  if (next.__type === 'lazyNode') {
    // if the our tree is lazy
    return reduceLazyNode(equals, reducer, prev, next)
  }
  // if next is a node
  return reduceNode(equals, reducer, prev, next)
}

function reduceLazyNode(equals, reducer, prev, lazyNode) {
  if (prev && prev.lazyNode && equals(lazyNode, prev.lazyNode)) {
    // if the previous lazyNode equals this lazyNode, then the resulting computation
    // is the same
    return prev
  }
  // otherwise, evaluate the lazyNode to get the tree
  const node = lazyNode.fn(...lazyNode.args)
  // reduce on the node and add this lazyNode to the computation
  const computation = reduceNode(equals, reducer, prev, node)
  return {
    ...computation,
    lazyNode,
  }
}

function reduceNode(equals, reducer, prev, node) {
  if (node.children && node.children.length > 0) {
    // recursively evaluate the node's children
    const children = zip((prev && prev.children) || [], node.children)
      .map(([child, comp]) => reduceLazyTree(equals, reducer, comp, child))
    // gather all of the results
    const result = children
      .map(comp => comp.result)
      .concat([node.value])
      .reduce(reducer)
    // return an object describing the computation
    return {
      __type: 'computation',
      node,
      result,
      children,
    }
  }
  // if there are no children then the result is the node's value
  return {
    __type: 'computation',
    node,
    result: node.value,
    children: [],
  }
}

// zip but return length of primary list
function zip(secondary, primary) {
  const result = []
  let idx = 0
  while (idx < primary.length) {
    result[idx] = [primary[idx], secondary[idx]]
    idx += 1
  }
  return result
}

function merge(a,b) {
  return {...a, ...b}
}

function equals(a, b) {
  return eq(a.fn, b.fn)
      && eq(a.args[0].state, b.args[0].state)
      && eq(a.args[0].dispatch, b.args[0].dispatch)
      && compare(a.args[0].pubs, b.args[0].pubs)
      && compare(a.args[0].props, b.args[0].props)
}

const HttpDriver = (app, dispatch) => {
  let pending = {}
  let prev = undefined
  return state => {
    const tree = app.http({dispatch, state})
    prev = reduceLazyTree(equals, merge, prev, tree)
    const requests = prev.result
    Object.keys(requests).forEach(key => {
      if (!pending[key]) {
        const req = requests[key]
        fetch(req.url, req)
        .then(response => response.json())
        .then(json => {
          if (pending[key]) {
            pending[key].onSuccess(json)
          }
        })
        .catch(error => {
          if (pending[key]) {
            pending[key].onError(error)
          }
        })
      }
    })
    pending = requests
  }
}

const targetValue = e => e.target.value
const id = x => x

const Weather = {
  init: () => ({
    query: '',
    fetching: false,
    error: undefined,
    result: undefined,
  }),
  update: (state, action) => {
    if (action.type === 'onChange') {
      return {
        ...state,
        query: action.payload
      }
    }
    if (action.type === 'onSubmit') {
      return {
        ...state,
        fetching: true,
        error: undefined,
        result: undefined,
      }
    }
    if (action.type === 'onError') {
      return {
        ...state,
        fetching: false,
        error: action.payload,
      }
    }
    if (action.type === 'onSuccess') {
      return {
        ...state,
        fetching: false,
        result: action.payload,
      }
    }
  },
  view: lazy(({dispatch, state}) => {
    const error = state.error ? <div>{JSON.stringify(state.error)}</div> : false
    const result = state.result ? <div>{state.result.name}: {state.result.weather[0].description}</div> : false
    const fetching = state.fetching ? <div>loading...</div> : false
    return (
      <div>
        <input
          value={state.query}
          onChange={dispatch('onChange', targetValue)}
        />
        <button onClick={dispatch('onSubmit')}>submit</button>
        {fetching}
        {error}
        {result}
      </div>
    )
  }),
  http: ({dispatch, state}) => {
    console.log('compute http')
    if (state.fetching) {
      return node({
        [state.query]: {
          method: 'get',
          url: `http://api.openweathermap.org/data/2.5/weather?APPID=d1038f86626c191d14fde59a7f548d6c&q=${state.query}`,
          onSuccess: dispatch('onSuccess', id),
          onError: dispatch('onError', id),
        }
      })
    }
    return node({})
  }
}

const twoOf = kind => ({
  init: () => ({
    one: kind.init(),
    two: kind.init(),
  }),
  update: (state, action) => {
    if (action.type === 'one') {
      return {
        one: kind.update(state.one, action.payload),
        two: state.two,
      }
    }
    if (action.type === 'two') {
      return {
        one: state.one,
        two: kind.update(state.two, action.payload),
      }
    }
  },
  view: lazy(({dispatch, state}) => (
    <div>
      {kind.view({
        dispatch: forward(dispatch, 'one'),
        state: state.one,
      })}
      {kind.view({
        dispatch: forward(dispatch, 'two'),
        state: state.two,
      })}
    </div>
  )),
  http: ({dispatch, state}) => {
    return node({}, [
      lazyNode(kind.http, {
        dispatch: forward(dispatch, 'one'),
        state: state.one,
      }).reduce(merge, {}).map(filterValues(propEq('method', 'get'))),
      lazyNode(kind.http, {
        dispatch: forward(dispatch, 'two'),
        state: state.two,
      }),
    ])
  },
})

const start = configure([ReactDriver, HttpDriver])
start(twoOf(Weather))


