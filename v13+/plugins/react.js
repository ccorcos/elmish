import React from 'react'
import ReactDOM from 'react-dom'
import { shallow } from 'elmish/v13+/utils/compare'

const Lazy = React.createClass({
  shouldComponentUpdate(nextProps) {
    return !(
      (nextProps.view === this.props.view) &&
      (nextProps.state === this.props.state) &&
      (shallow(nextProps.props, this.props.props)) &&
      (shallow(nextProps.pub, this.props.pub)) &&
      (nextProps.dispatch.equals(this.props.dispatch))
    )
  },
  render() {
    return this.props.view(
      this.props.dispatch,
      this.props.state,
      this.props.pub,
      this.props.props
    )
  }
})

const lazy = (view) => (dispatch, state, pub, props) => {
  return React.createElement(Lazy, {view, dispatch, state, pub, props})
}

const plugin = root => ({
  lift: {
    view: (path, viewState, liftDispatch) => (obj) => (dispatch, state, pub, props) =>
      lazy(obj.view)(
        liftDispatch(dispatch),
        viewState(state),
        obj.subscribe(viewState(state), pub, props),
        props
      ),
  },
  driver: {
    view: (app, dispatch, batch) => ({state, pub}) => {
      const html = app.view(dispatch, state, pub)
      ReactDOM.render(html, root)
    }
  }
})

export default plugin
