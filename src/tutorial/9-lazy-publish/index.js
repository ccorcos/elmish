import React from 'react'
import ReactDOM from 'react-dom'

// WIP
// - publish is lazily gathered
// - subscribe is lazily gathered?
// - laziness should only compare pubs that are subscribed to

const Health = {
  init: () => 100,
  update: (state, action) => state + action,
  publish: ({dispatch, state}) => {
    return {
      health: state,
      hit: dispatch,
    }
  },
}

const Game = {
  subscribe: () => {
    return {
      hit: true,
    }
  },
  view: ({pubs}) => (
    <div>
      <button onClick={() => pubs.hit(-1)}>{'-1'}</button>
      <button onClick={() => pubs.hit(-10)}>{'-10'}</button>
    </div>
  )
}

const Dashboard = {
  subscribe: () => {
    return {
      health: true,
    }
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
  subscribe: ({state}) => {
    // lazy node
  },
  update: (state, action) => {
    if (action.type === 'health') {
      return {
        health: Health.update(state.health, action.action),
      }
    }
  },
  publish: ({dispatch, state}) => {
    return Health.publish({
      dispatch: action => dispatch({type: 'health', action}),
      state: state.health,
    })
  },
  view: ({dispatch, pubs, state}) => (
    <div>
      {Game.view({pubs})}
      {Dashboard.view({pubs})}
    </div>
  ),
}

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
