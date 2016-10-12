import React from 'react'
import ReactDOM from 'react-dom'
import { eq, compare } from './utils'

// lazy react component
const Lazy = React.createClass({
  shouldComponentUpdate: function(next) {
    const props = this.props
    return !eq(props.state, next.state)
        || !eq(props.dispatch, next.dispatch)
        || !compare(props.pubs, next.pubs)
        || !compare(props.props, next.props)
  },
  render: function() {
    const {view, ...args} = this.props
    return view(args)
  }
})

// wrap the view function
export const lazy = view => ({dispatch, state, pubs, props}) =>
  <Lazy view={view} dispatch={dispatch} state={state} pubs={pubs} props={props}/>


const ReactDriver = (app, dispatch) => {
  const root = document.getElementById('root')
  return state => {
    ReactDOM.render(app.view({dispatch, state}), root)
  }
}

export default ReactDriver
