import ReactDOM from 'react-dom'

const start = app => {
  const root = document.getElementById('root')
  let state = app.init()
  const dispatch = action => {
    state = app.update(state, action)
    ReactDOM.render(app.view(dispatch, state), root)
  }
  ReactDOM.render(app.view(dispatch, state), root)
}

export default start
