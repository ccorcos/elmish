import React from 'react'
import ReactDOM from 'react-dom'

import ReactDriver, { lazy } from '../8-lazy-http/react'
import { eq, compare } from '../8-lazy-http/utils'
import configure, {forward, callback} from '../8-lazy-http/elmish'

// WIP
// - lazy tree
//   - map over tree
//   - meta nodes
//     - keyed
//     - isolate... generic version?
// - publish is lazily gathered
// - subscribe is lazily gathered?
// - laziness should only compare pubs that are subscribed to

const Health = {
  init: () => 100,
  update: (state, action) => state + action,
  publish: ({dispatch, state}) => {
    return node({
      health: state,
      hit: dispatch,
    })
  },
}

const Game = {
  subscribe: state => {
    return node({
      hit: true,
    })
  },
  view: ({pubs}) => (
    <div>
      <button onClick={callback(pubs.hit, -1)}>{'-1'}</button>
      <button onClick={callback(pubs.hit, -10)}>{'-10'}</button>
    </div>
  )
}

const Dashboard = {
  subscribe: state => {
    return node({
      health: true,
    })
  },
  view: ({pubs}) => (
    <div>
      HEALTH: {pubs.health}
      <div>
        {pubs.health <= 0 ? 'GAME OVER' : false}
      </div>
    </div>
  )
}

const App = {
  init: () => {
    return {
      health: Health.init(),
    }
  },
  update: (state, action) => {
    if (action.type === 'health') {
      return {
        health: Health.update(state.health, action.action),
      }
    }
  },
  subscribe: state => {
    return node({}, [
      lazyNode(Game.subscribe, state.game),
      lazyNode(Dashboard.subscribe, state.dasboard),
    ])
  },
  publish: ({dispatch, state}) => {
    return node({}, [
      lazyNode(Health.publish, {
        dispatch: forward(dispatch, 'health'),
        state: state.health,
      })
    ])
  },
  view: lazy(({dispatch, pubs, state}) => (
    <div>
      {Game.view({pubs})}
      {Dashboard.view({pubs})}
    </div>
  )),
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
  subscribe: state => {
    return node({},
      lazyNode(kind.subscribe, state.one),
      lazyNode(kind.subscribe, state.two),
    )
  },
  publish: ({dispatch, state}) => {
    // we need some way of mapping over the result of the reduction in order
    // to namespace each of these publications...
    return node({},
      lazyNode(kind.publish, {
        dispatch: forward(dispatch, 'one'),
        state: state.one,
      }),
      lazyNode(kind.publish, {
        dispatch: forward(dispatch, 'two'),
        state: state.two,
      }),
    )
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
})


const start = app => {
  const root = document.getElementById('root')
  let state = app.init()
  let pubs
  const dispatch = action => {
    state = app.update(state, action)
    pubs = app.publish({dispatch, state})
    ReactDOM.render(app.view({dispatch, pubs, state}), root)
  }
  pubs = app.publish({dispatch, state})
  ReactDOM.render(app.view({dispatch, pubs, state}), root)
}

start(App)
