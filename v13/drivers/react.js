import { shallowCompare } from 'elmish/v13/utils/compare'

const Lazy = React.createClass({
  shouldComponentUpdate(nextProps) {
    return !(
      (nextProps.view === this.props.view) &&
      (nextProps.state === this.props.state) &&
      (shallowCompare(nextProps.props, this.props.props)) &&
      (shallowCompare(nextProps.pub, this.props.pub)) &&
      // TODO comparing thunks!
      (R.equals(nextProps.dispatch, this.props.dispatch))
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

export const lazy = (view) => (dispatch, state, pub, props) => {
  return React.createElement(Lazy, {view, dispatch, state, pub, props})
}

// TODO lots of other drivers are going to use this so we might want to keep
// it somewhere shared. also, we should think about how publish / subscribe
// can work as drivers so long as we use objects rather than fixes arguments...
export const lift = (obj, path, lens) => {
  if (obj.view) {
    return {
      ...obj,
      view: (dispatch, state, pub, props) => {
        return lazy(obj.view)(
          liftDispatch(dispatch, path),
          R.view(lens, state),
          obj.subscribe(R.view(lens, state), pub, props),
          props
        )
      }
    }
  } else {
    return obj
  }
}

const root = document.getElementById('root')

export const connect = (app, dispatch) => (state, pub) => {
  const html = app.view(dispatch, state, pub)
  ReactDOM.render(html, root)
}