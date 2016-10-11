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

const reduce = (name, sibling, parent, tree) => {
  const override = `_${name}`
  if (tree[override]) {
    return tree[override]
  }
  if (tree[name]) {
    if (tree.children) {
      return parent(
        tree[name],
        tree.children.map(child => reduce(name, sibling, parent, child)).reduce(sibling)
      )
    } else {
      return tree[name]
    }
  }
}

const plugin = root => ({
  lift: {
    view: (path, viewState, liftDispatch) => (obj) => (dispatch, state, pub, props) => {
      const subscribe = reduce(
        'subscribe',
        (p1, p2) => (state, pub, props) => R.merge(p1(state, pub, props), p2(state, pub, props)),
        (p1, p2) => (state, pub, props) => R.merge(p1(state, pub, props), p2(state, pub, props)),
        obj
      )
      return lazy(obj.view)(
        liftDispatch(dispatch),
        viewState(state),
        subscribe && subscribe(viewState(state), pub, props),
        props
      )
    },
  },
  drivers: {
    view: (app, dispatch, batch) => ({state, pub}) => {
      const html = app.view(dispatch, state, pub)
      ReactDOM.render(html, root)
    }
  }
})

export default plugin
