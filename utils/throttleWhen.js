import flyd from 'flyd'
import batchWhen from 'elmish/utils/batchWhen'
import last from 'ramda/src/last'

const throttleWhen = flyd.curryN(2, (sBool, sA) => {
  return flyd.map(last, batchWhen(sBool, sA))
});

export default throttleWhen