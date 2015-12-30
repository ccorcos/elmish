import flyd from 'flyd'
import last from 'ramda/src/last'

import batchWhen from 'elmish/src/utils/batchWhen'

const throttleWhen = flyd.curryN(2, (sBool, sA) => {
  return flyd.map(last, batchWhen(sBool, sA))
});

export default throttleWhen