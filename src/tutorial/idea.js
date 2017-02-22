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

import React, { PureComponent, Children } from 'react'
import ReactDOM from 'react-dom'

class Tagger extends PureComponent {
  static contextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  static childContextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  dispatch = action => this.context.dispatch(action)
  getChildContext() {
    return { dispatch: this.dispatch }
  }
  render() {
    const {fn, component, ...props} = this.props
    const WrappedComponent = component
    return <WrappedComponent {...props}/>
  }
}

class Component extends PureComponent {
  static contextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  static map(fn, props) {
    return <Tagger fn={fn} component={this} {...props}/>
  }
}

class Dispatcher extends PureComponent {
  static childContextTypes = {
    dispatch: React.PropTypes.func.isRequired,
  }
  getChildContext() {
    return { dispatch: this.props.dispatch }
  }
  render() {
    return Children.only(this.props.children)
  }
}

class Counter extends Component {
  dec = () => this.context.dispatch(-1)
  inc = () => this.context.dispatch(+1)
  static init = () => 0
  static update = (state, action) => state + action
  render() {
    console.log('counter', this.props.state)
    return (
      <div>
        <button onClick={this.dec}>{'-'}</button>
        <span>{this.props.state}</span>
        <button onClick={this.inc}>{'+'}</button>
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
  one = action => ({type: 'one', action})
  two = action => ({type: 'two', action})
  render() {
    return (
      <div>
        {Counter.map(this.one, {state: this.props.state.one})}
        {Counter.map(this.two, {state: this.props.state.two})}
      </div>
    )
  }
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

start(Counter)
