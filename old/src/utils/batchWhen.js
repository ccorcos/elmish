import flyd from 'flyd'
import { dropRepeats } from 'flyd/module/droprepeats'
import contains from 'ramda/src/contains'

// this function will batch all values from sA while sBool it true.
// when sBool toggles to false, if any values have been batched, then
// they will emit.

const batchWhen = flyd.curryN(2, (sBool, sA) => {
  let batch = []

  const ns = flyd.combine(function(sBool, sA, self, changed) {

    const sBoolChanged = contains(sBool, changed)
    const sAChanged = contains(sA, changed)

    if (sBoolChanged) {
      if (sAChanged) {
        if (sBool()) {
          // if Bool and A change and were batching then
          // push to the batch
          batch.push(sA())
        } else {
          // if Bool and A change and we're not batching
          // anymore, then push the batch
          batch.push(sA())
          self(batch)
          batch = []
        }
      } else {
        if (!sBool()) {
          // if Bool changed but A didnt then push the batch
          // if there were any batching
          if (batch.length > 0) {
            self(batch)
            batch = []
          }
        }
      }
    } else if (sAChanged) {
      if (sBool()) {
        // if we're batching then push to the batch
        batch.push(sA())
      } else {
        // otherwise send it alone
        self([sA()])
      }
    } else {
      // if none changed meaning this is the initail run through
      if (sBool()) {
        batch.push(sA())
      } else {
        self([sA()])
      }
    }

  }, [dropRepeats(sBool), sA])

  return ns
});

export default batchWhen
