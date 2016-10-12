import React from 'react'
import ReactDOM from 'react-dom'

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
  view: ({dispatch, state}) => {
    const error = state.error ? <div>{JSON.stringify(state.error)}</div> : false
    const result = state.result ? <div>{state.result.name}: {state.result.weather[0].description}</div> : false
    const fetching = state.fetching ? <div>loading...</div> : false
    return (
      <div>
        <input
          value={state.query}
          onChange={e => dispatch({type: 'onChange', payload: e.target.value})}
        />
        <button onClick={() => dispatch({type: 'onSubmit'})}>submit</button>
        {fetching}
        {error}
        {result}
      </div>
    )
  },
  http: ({dispatch, state}) => {
    if (state.fetching) {
      return {
        [state.query]: {
          method: 'get',
          url: `http://api.openweathermap.org/data/2.5/weather?APPID=d1038f86626c191d14fde59a7f548d6c&q=${state.query}`,
          onSuccess: json => dispatch({type: 'onSuccess', payload: json}),
          onError: error => dispatch({type: 'onError', payload: error}),
        }
      }
    }
    return {}
  }
}

const ReactDriver = (app, dispatch) => {
  const root = document.getElementById('root')
  return state => {
    ReactDOM.render(app.view({dispatch, state}), root)
  }
}

const HttpDriver = (app, dispatch) => {
  let pending = {}
  return state => {
    const requests = app.http({dispatch, state})
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

const configure = drivers => app => {
  let state = app.init()
  const listeners = drivers.map(d => d(app, dispatch))
  function dispatch(action) {
    state = app.update(state, action)
    listeners.forEach(l => l(state))
  }
  listeners.forEach(l => l(state))
}

const start = configure([ReactDriver, HttpDriver])
start(Weather)
