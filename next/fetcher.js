import differenceWith from 'ramda/src/differenceWith'
import find from 'ramda/src/find'
import propEq from 'ramda/src/propEq'
import omit from 'ramda/src/omit'

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

let pending = []

const fetch = (requests) => {
  const newRequests = differenceWith(sameKey, requests, pending)
  pending = requests
  newRequests.map((request) => {
    fetchWithJson(request.url, omit(['key', 'url'], request))
      .then((result) => {
        // only dispatch the action if its being requested still
        const req = find(propEq('key', request.key), pending)
        if (req) {
          req.onSuccess(result)
        }
      })
      .catch((error) => {
        // only dispatch the action if its being requested still
        const req = find(propEq('key', request.key), pending)
        if (req) {
          req.onError(error)
        }
      })
  })
}

export default fetch
