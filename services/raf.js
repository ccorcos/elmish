import flyd from 'flyd'
import prop from 'ramda/src/prop'
import call from 'ramda/src/call'
import map  from 'ramda/src/map'
import raf  from 'raf'

const handleRafs = (rafs=[]) => {
  raf(() => {
    map(call, rafs)
  })
}

const rafListener = (effect$) => flyd.on(handleRafs, flyd.map(prop('raf'), effect$))

export default rafListener