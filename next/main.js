import start from 'next/elmish'
import fetch from 'next/fetcher'
import ReactDOM from 'react-dom'
import app from 'next/giphy'
import debug from 'next/debug'
import flyd from 'flyd'

const render = (html) =>
  ReactDOM.render(html, document.getElementById('root'))

let {effect$, state$} = start(debug(app))

let handler = flyd.map(({html, http}) => {
  render(html)
  fetch(http)
}, effect$)

// check if HMR is enabled
if (module.hot) {
  // accept update of dependency
  module.hot.accept(["next/giphy", "next/debug"], () => {
    // save the previous state of the application
    const state = state$()
    // stop all side-effects
    handler.end(true)
    // import the latest versions
    let app = require('next/giphy').default
    let debug = require('next/debug').default
    // override init
    const {view, update} = debug(app)    
    const init = () => state
    // mutate and restart side-effects
    const result = start({init, view, update})
    effect$ = result.effect$
    state$ = result.state$
    handler = flyd.map(({html, http}) => {
      render(html)
      fetch(http)
    }, effect$)
  });
}