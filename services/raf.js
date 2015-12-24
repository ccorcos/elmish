import flyd from 'flyd'
import prop from 'ramda/src/prop'
import call from 'ramda/src/call'
import map  from 'ramda/src/map'
import raf  from 'raf'

// every time we call a tick, we'll get a re-render and another
// set of animations, so if there are many animations, we'll get
// a call to handleRafs before the second tick is fires leading
// to a quadratic amount of ticks. Thus, we'll make sure to wait
// until the last tick is fired before we consider requesting
// another animation frame.

let wait = false
let time = undefined
let tick = () => {
  const now = Date.now()
  const dt = now - time
  time = now
  return dt
}
const handleRafs = (rafs=[]) => {
  if (rafs.length === 0) {
    time = undefined
    return
  }
  if (!wait) {
    wait = true
    if (!time) {
      time = Date.now()
    }
    raf(() => {
      const [first, ...rest] = rafs
      const dt = tick()
      rest.map(f => f(dt))
      wait = false
      first && first(dt)
    })
  }
}

const rafListener = (effect$) => flyd.on(handleRafs, flyd.map(prop('raf'), effect$))

export default rafListener