import flyd from 'flyd'
import prop from 'ramda/src/prop'
import call from 'ramda/src/call'
import map  from 'ramda/src/map'
import raf  from 'raf'
import ReactDOM from 'react-dom'

const render = ReactDOM.render.bind(ReactDOM)
const noop = () => {console.log('blocked')}
const blockRender = () => {
  ReactDOM.render = noop
}
const unblockRender = () => {
  ReactDOM.render = render
}

// every time we call a tick, we'll get a re-render and another
// set of animations, so if there are many animations, we'll get
// a call to handleRafs before the second tick is fires leading
// to a quadratic amount of ticks. Thus, we'll make sure to `wait`
// until the last tick is fired before we consider requesting
// another animation frame.
let wait = false

// we'll also keep track of the time and compute time deltas which
// are sent with the request animation frame tick so our animations
// can recover when they're paused
let time = undefined

let calcDt = () => {
  const now = Date.now()
  const dt = now - time
  time = now
  return dt
}

// Here we'll handle an array of raf animation tick requests
const handleRafs = (rafs=[]) => {
  
  if (rafs.length === 0) {
    // if there are no animations, unset the time and stop batching
    time = undefined
    return
  }

  // wait for this raf cycle to finish
  if (!wait) {
    wait = true
    // initialize the time for calculating `dt`
    if (!time) { 
      time = Date.now()
    }
    raf(() => {
      // blockRender()
      const [first, ...rest] = rafs
      const dt = calcDt()
      rest.map(f => f(dt))
      // stop waiting to trigger another raf if we're still
      // animating after this tick
      wait = false
      // unblockRender()
      first && first(dt)
    })
  }
}

const rafListener = (effect$) => flyd.on(handleRafs, flyd.map(prop('raf'), effect$))

export default rafListener