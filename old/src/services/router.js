/*

Routing is challenging because it's so deeply integrated into browsers and not
entirely exposed in JavaScript because some bad things could happen if websites
could arbitrarily mess with your browser history. Luckily the relatively new
History API isn't too hard to to work with, but we'll still have to change
the way we think about routing in the browser.

https://developer.mozilla.org/en-US/docs/Web/API/History_API

Clicking an anchor tag <a href="/somewhere">Somewhere</a> is fundamentally a
side-effect that short circuits any of our application logic. Back in the day
this was fine because routing was the application logic. We'd reload a new HTML
page and move on. But now our websites are becoming fully featured applications.
Some apps with a classic Tab-Nav layout will have several navigation histories
disjointed by several tabs. This no longer plays nice with the single linear
history that we're used in our browser.

This router service is a declarative API for controlling the browser history
and handling built-in navigation controls like the back and forward buttons.
Since there is an external state (`window.history`) to work with, I had to think
about some trade-off for how we'd actually use the browser history while still
maintaining control of routing within the application.

I was initially planning on building this by encoding the entire routing state of
the application in a serializable object that gets saves in the history with when
you call `window.pushState(state, title, path)`. This is awesome except we'll end
up having to imperatively call `window.history.back()` whenever we want to navigate
back. If we start the app in an arbitrary state, then the `window.history` state
may be out of sync with our application state and will break upon an imperative call
to `window.history.back()`. And due to security limitations, you cannot inspect and
set the browser history to whatever you want. So I was forced to abandon this approach.

The solution I settled on was to keep all of the routing state within the
application. The `window.history` API is used to update the url to be in sync
with the application state so we can get back to the same page by sharing the url.
You declaratively specify what you want the url to be using `path` which is relative
to the root url with a leading slash. This service also provides callbacks for
`onForward` and `onBack` when the user uses the native browser functionality. These
callbacks are passed with the path that linear browser history expects you to be
on although it does not need to be respected along with a time variable which
represents the linear order of routes that this path lies in. `onSkip` happens when
you click a link that is more than one away either forward or backward in your
browser history.

A declarative routing object looks like this:

route: [{
  path: '/the/current/route',
  onBack: (path, time) => {},
  onForward: (path, time) => {}
  onSkip: (path, time) => {}
}]

You can use the `elmish/ui/history` component if you just want basic linear routing
similar to that of `window.history`.

*/

import flyd from 'flyd'
import prop from 'ramda/src/prop'
import reduce from 'ramda/src/reduce'
import merge from 'ramda/src/merge'

const router = (effect$) => {

  // This is the declarative route object
  let spec = null

  // Set the initial browser history state
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

  const route$ = flyd.map(prop('route'), effect$)
  flyd.on(setRoutingSpec, route$)

}

export default router
