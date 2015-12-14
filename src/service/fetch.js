import flyd from 'flyd'
import differenceWith from 'ramda/src/differenceWith'
import find from 'ramda/src/find'
import propEq from 'ramda/src/propEq'
import omit from 'ramda/src/omit'
import prop from 'ramda/src/prop'

// window.fetch polyfill
import 'whatwg-fetch'

const sameKey = (a, b) => a.key === b.key

const fetchWithJson = (url, options) => {
  let result = null
  return window.fetch(url, options)
    .then((res) => {
      result = res
      return res && res.json && res.json()
    })
    .then((json) => {
      result.json = json
      return result
    })
}

function exposeErrors(fn) {
  return function() {
    try {
      return fn.apply(null, arguments)
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

let pending = []

const fetch = (requests=[]) => {
  const newRequests = differenceWith(sameKey, requests, pending)
  pending = requests
  newRequests.map((request) => {
    fetchWithJson(request.url, omit(['key', 'url'], request))
      .then(exposeErrors((result) => {
        // only dispatch the action if its being requested still
        const req = find(propEq('key', request.key), pending)
        if (req) {
          req.onSuccess(result)
        }
      }))
      .catch(exposeErrors((error) => {
        // only dispatch the action if its being requested still
        const req = find(propEq('key', request.key), pending)
        if (req) {
          req.onError(error)
        }
      }))
  })
}

const fetchListeber = (effect$) => flyd.on(fetch, flyd.map(prop('http'), effect$))

export default fetchListeber
