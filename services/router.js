/*

Routing is challenging because it's so deeply integrated into browsers. Luckily
the History API isn't too hard to to work with, but we'll still have to change
the way we fundamentally think about routing in the browser.

https://developer.mozilla.org/en-US/docs/Web/API/History_API

Clicking an anchor tag <a href="/somewhere">Somewhere</a> is fundamentally a 
side-effect that short circuits any of our application logic. Back in the day
this was fine because routing was the application logic. We'd reload a new HTML 
page and move on. But now our websites are becoming fully featured applications.
Some apps with a classic Tab-Nav layout will have several navigation histories
disjointed by several tabs. This no longer plays nice with the single linear browser
history that we're used in our browser.

The router service is a declarative API for controlling the browser history
and handling built-in navigation controls like the back and forward buttons.

There are two directions we could have gone with this service and I'll explain my
decision. 

(1) We can encode the entire routing-state of the application in a serializable 
object and save that in the history with `window.pushState(state, title, path)`. 
This is awesome except we'll end up having to imperatively call `window.history.back()` 
whenever we want to navigate back. If we start the app in an arbitrary state, then the 
`window.history` state may be out of sync with our application state and will break
upon an imperative call to `window.history.back()`. 

(2) The solution I settled on was to keep all of the routing state within the 
application and simply use `window.history` to update the url so we can get back to
the same page, and to listen for onForward and onBack events to leverage any native
routing user interface elements.

A declarative routing object looks like this:

{
  path: '/the/current/route',
  onBack: () => {},
  onForward: () => {}
  onSkip: (path) => {}
}

The only thing tricky here is onSkip which happens if you select some route from your
history that isn't pressing the back or forward buttons in your browser.

*/


// Browsers tend to handle the popstate event differently on page load. Chrome (prior to v34) and Safari always emit a popstate event on page load, but Firefox doesn't.

import flyd     from 'flyd'
import prop     from 'ramda/src/prop'
import reduce   from 'ramda/src/reduce'
import merge    from 'ramda/src/merge'


// spec : {
//   path: window.location.pathname,
//   onBack: (path, t) => {},
//   onForward: (path, t) => {},
//   onSkip: (path, t) => {}
// }
let spec = null

// set the initial browser history state
window.history.replaceState({t: 0,  path: window.location.pathname}, '')

// keep track of time so we can determine if onpopstate is forward, back,
// pageLoad, or an entirely different route from history.
let time = 0

window.onpopstate = function(event) {
  const {t, path} = event.state
  
  if (t === time) {
    // if we're on the same page, then don't do anything
    return
  }

  if (t === time + 1) {
    // the user clicked forward
    time = time + 1
    spec && spec.onForward && spec.onForward(path, t)
    return
  }

  if (t === time - 1) {
    // the user clicked back
    time = time - 1
    spec && spec.onBack && spec.onBack(path, t)
    return
  }

  // otherwise, the user has selected an item from history
  if (!path) {
    console.warn("Uh oh. Unexpected route change. Please report this error.")
    return
  }

  time = t
  spec && spec.onSkip && spec.onSkip(path, t)
  return
}

const setRoutingSpec = (specs) => {
  const nextSpec = reduce(merge, {}, specs)
  const {path} = nextSpec
  if (path !== window.location.pathname) {
    time = time + 1
    window.history.pushState({t: time, path: path}, '', path)
  }
  spec = nextSpec
}

const routeListener = (effect$) => flyd.on(setRoutingSpec, flyd.map(prop('route'), effect$))

export default routeListener
