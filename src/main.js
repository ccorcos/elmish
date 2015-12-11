import start    from 'src/elmish'
import debug    from 'src/debug'
import fetch    from 'src/http'
import keys     from 'src/hotkeys'
import ReactDOM from 'react-dom'
import flyd     from 'flyd'

import app      from 'src/app'

const render = (html) =>
  ReactDOM.render(html, document.getElementById('root'))

let {effect$, state$} = start(debug(app))

let handler = flyd.map(({html, http, hotkeys}) => {
  render(html)
  fetch(http)
  keys(hotkeys)
}, effect$)

// check if HMR is enabled
if (module.hot) {
  // accept update of dependency
  module.hot.accept(["src/giphy", "src/debug"], () => {
    // save the previous state of the application
    const state = state$()
    // stop all side-effects
    handler.end(true)
    // import the latest versions
    let app = require('src/giphy').default
    let debug = require('src/debug').default
    // override init
    const {effects, update} = debug(app)
    const init = () => state
    // mutate and restart side-effects
    const result = start({init, effects, update})
    effect$ = result.effect$
    state$ = result.state$
    handler = flyd.map(({html, http}) => {
      render(html)
      fetch(http)
    }, effect$)
  });
}
