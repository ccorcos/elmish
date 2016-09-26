import { computeEffect } from 'elmish/v16/elmish'
import { reduceLazyTree } from 'elmish/v16/lazy-tree'
import { effectEquals } from 'elmish/v16/utils/compare'
import R from 'ramda'

const driver = (app, dispatch, batch) => {

  let computation = undefined
  let inFlight = {}

  const sendRequest = (key, request) => {
    window.fetch(request.url, R.omit(['key', 'onSuccess', 'onFailure'], request))
    .then(response => {
      response.json().then(json => {
        response.json = json
        const handler = inFlight[key]
        if (handler) {
          batch(() => {
            handler.onSuccess(response)
          })
        }
      })
    })
    .catch(error => {
      const handler = inFlight[key]
      if (handler) {
        batch(() => {
          handler.onFailure(error)
        })
      }
    })
  }

  const mergeDispatch = (a, b) => (...args) => {
    a(...args)
    b(...args)
  }

  const combineHttpEffects = (a, b) => {
    return {
      ...a,
      onSuccess: mergeDispatch(a.onSuccess, b.onSuccess),
      onFailure: mergeDispatch(a.onFailure, b.onFailure),
    }
  }

  return tree => {
    computation = reduceLazyTree(effectEquals, (a,b) => {
      return R.mergeWith(combineHttpEffects, a, b)
    }, undefined, tree)

    const requests = computation.result

    Object.keys(requests).forEach(key => {
      if (!inFlight[key]) {
        sendRequest(key, requests[key])
      }
      inFlight[key] = requests[key]
    })

    Object.keys(inFlight).forEach(key => {
      if (!requests[key]) {
        delete inFlight[key]
      }
    })
  }
}

export default {
  effect: 'http',
  initialize: driver,
}
