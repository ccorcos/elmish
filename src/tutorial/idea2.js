/*
A Little experiment:

class A {}
class B extends A {}
class C extends B {
  static f() {
    console.log(this)
  }
}
class D extends C {}
D.f() // => [Function: D]
*/

import React from 'react'
import ReactDOM from 'react-dom'
import shallowequal from 'shallowequal'

class Tagger extends React.Component {
  static contextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  static childContextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  dispatch = action => this.context.dispatch({...this.props.tag, action})
  getChildContext() {
    return { dispatch: this.dispatch }
  }
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const {tag: oldTag, ...oldProps} = this.props
    const {tag: newTag, ...newProps} = nextProps
    return !shallowequal(oldTag, newTag)
        || !shallowequal(oldProps, newProps)
        || !shallowequal(this.context, nextContext)
  }
  render() {
    const {tag, component, ...props} = this.props
    const WrappedComponent = component
    return <WrappedComponent {...props}/>
  }
}

class Component extends React.PureComponent {
  constructor(props) {
    super(props)
    this._actions = {}
    Object.keys(this.constructor.actions || {}).forEach(key => {
      this._actions[key] = (...args) => {
        return this.context.dispatch(this.constructor.actions[key](this.props, ...args))
      }
    })
  }
  static contextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  static tag(tag, props) {
    return <Tagger tag={tag} component={this} {...props}/>
  }
  render() {
    return this.constructor.view(this.props, this._actions)
  }
}

class Dispatcher extends React.PureComponent {
  static childContextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  getChildContext() {
    return { dispatch: this.props.dispatch }
  }
  render() {
    return React.Children.only(this.props.children)
  }
}

class Counter extends Component {
  static actions = {
    dec: (props) => -1,
    inc: (props) => +1,
  }
  static init = () => 0
  static update = (state, action) => state + action
  static view = (props, actions) => {
    console.log('counter')
    return (
      <div>
        <button onClick={actions.dec}>{'-'}</button>
        <span>{props.state}</span>
        <button onClick={actions.inc}>{'+'}</button>
      </div>
    )
  }
}

class TwoCounters extends Component {
  static init() {
    return {
      one: Counter.init(),
      two: Counter.init(),
    }
  }
  static update(state, action) {
    if (action.type === 'one') {
      return {
        one: Counter.update(state.one, action.action),
        two: state.two,
      }
    }
    if (action.type === 'two') {
      return {
        one: state.one,
        two: Counter.update(state.two, action.action),
      }
    }
  }
  static view = (props, actions) => (
    <div>
      {Counter.tag({type: 'one'}, {state: props.state.one})}
      {Counter.tag({type: 'two'}, {state: props.state.two})}
    </div>
  )
}

const TwoOf = (Kind) =>
  class Two extends Component {
    static init() {
      return {
        one: Kind.init(),
        two: Kind.init(),
      }
    }
    static update(state, action) {
      if (action.type === 'one') {
        return {
          one: Kind.update(state.one, action.action),
          two: state.two,
        }
      }
      if (action.type === 'two') {
        return {
          one: state.one,
          two: Kind.update(state.two, action.action),
        }
      }
    }
    static view = (props, actions) => (
      <div>
        {Kind.tag({type: 'one'}, {state: props.state.one})}
        {Kind.tag({type: 'two'}, {state: props.state.two})}
      </div>
    )
  }

const ListOf = (Kind) =>
  class List extends Component {
    static init() {
      return {
        id: 1,
        list: [{
          id: 0,
          state: Kind.init(),
        }],
      }
    }
    static update(state, action) {
      if (action.type === 'insert') {
        return {
          id: state.id + 1,
          list: state.list.concat([{
            id: state.id,
            state: Kind.init(),
          }]),
        }
      }
      if (action.type === 'remove') {
        return {
          id: state.id,
          list: state.list.filter(item => item.id !== action.id),
        }
      }
      if (action.type === 'item') {
        return {
          id: state.id,
          list: state.list.map(item => {
            if (item.id === action.id) {
              return {
                id: item.id,
                state: Kind.update(item.state, action.action)
              }
            }
            return item
          }),
        }
      }
    }
    static actions = {
      insert: (props) => ({type: 'insert'}),
      remove: (props) => ({type: 'remove'}),
    }
    static view = (props, actions) => (
      <div>
        <button onClick={actions.insert}>insert</button>
        {props.state.list.map(item => (
          <div key={item.id}>
            {Kind.tag({type: 'item', id: item.id}, {state: item.state})}
            {RemoveButton.tag({type: 'remove', id: item.id}, {})}
          </div>
        ))}
      </div>
    )
  }

class RemoveButton extends Component {
  static actions = {
    remove: props => {}
  }
  static view = (props, actions) =>
    <button onClick={actions.remove}>remove</button>
}

const start = App => {
  const root = document.getElementById('root')
  let state = App.init()
  const dispatch = action => {
    state = App.update(state, action)
    ReactDOM.render((
      <Dispatcher dispatch={dispatch}>
        <App state={state}/>
      </Dispatcher>
    ), root)
  }
  ReactDOM.render((
    <Dispatcher dispatch={dispatch}>
      <App state={state}/>
    </Dispatcher>
  ), root)
}

start(ListOf(TwoOf(Counter)))
