import flyd from 'flyd'
import React from 'react'
import ReactDOM from 'react-dom'
import { shallowEquals } from 'elmish/v16/utils/compare'
import { isPlainObject, isString } from 'elmish/v16/utils/is'
import { mapDispatch } from 'elmish/v16/elmish'
import R from 'ramda'

// wrap the component view function in a lazy component
const Lazy = React.createClass({
  shouldComponentUpdate(nextProps) {
    return nextProps.view !== this.props.view
        || nextProps.state !== this.props.state
        || !nextProps.dispatch.equals(this.props.dispatch)
        || !shallowEquals(nextProps.props, this.props.props)
  },
  render() {
    return this.props.view(this.props)
  }
})

// a helper function for generating React elements using hyperscript syntax
export const h = (value, props, children) => {
  if (isPlainObject(value)) {
    return React.createElement(Lazy, {
      view: value.effects._react,
      dispatch: mapDispatch(value.nested.action[0], props.dispatch),
      state: R.view(value.nested.lens, props.state),
      props: props.props,
    }, children)
  }
  if (isString(value)) {
    const classNameList = value.match(/(\.\w+)/g)
    const className = classNameList && classNameList.map(x => x.slice(1)).join(' ')
    const id = idList && idList[0].slice(1)
    const idList = value.match(/(\.\w+)/)
    const tag = value.match(/^\w+/)[0]
    const args = [tag, {...props, id, className}].concat(children)
    return React.createElement(...args)
  }
  return React.createElement(value, props, children)
}

export default root => ({
  effect: 'react',
  initialize: (app, dispatch) => vdom => {
    // const vdom = app.effects._react({dispatch, state})
    ReactDOM.render(vdom, root)
  }
})
