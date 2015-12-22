// This component displays a list of repositories that some user has starred.
// Notice that the http side-effect is returning a function (due to the __),
// and not a proper "fetch" object. That's becuase this component is entirely
// unconcerned with who's stars its displaying. This is very similar to a
// concept in Relay and GraphQL called query fragments. We could just as
// easily created passed the username to this component, I like this way more.

import github  from 'elmish/tutorial/8/github'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'
import pipe    from 'ramda/src/pipe'
import sortBy  from 'ramda/src/sortBy'
import prop    from 'ramda/src/prop'
import reverse from 'ramda/src/reverse'
import map     from 'ramda/src/map'
import __      from 'ramda/src/__'
import h       from 'react-hyperscript'

import 'elmish/tutorial/8/styles/starList.styl'

const init = () => {
 return { stars: [], pending: true, error: false }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'stars':
      return merge(state, {
        stars: action.stars,
        pending: false,
        error: false
      })
    case 'error':
      console.warn("ERROR:", state, action)
      return merge(state, {
        stars: [],
        pending: false,
        error: action.error
      })
    default:
      return state
  }
})

let declare = curry((dispatch, state) => {

  const item = (repo) => {
    return (
      h('div.repo', {}, [
        h('div.stars', {}, repo.stargazers_count),
        h('a.name', {href: repo.html_url}, repo.full_name)
      ])
    )
  }

  return {
    html:
      state.pending   ? 'loading...' :
      state.error     ? state.error  :
      state.stars     ? pipe(
                          sortBy(prop('stargazers_count')),
                          reverse,
                          map(item)
                        )(state.stars) :
      console.warn("this should never happen"),
    http: !state.pending ? [] : [
      github.stars(__, {
        onSuccess: (response) => {
          return dispatch({type: 'stars', stars: response.json})
        },
        onError: (response) => {
          return dispatch({type: 'error', error: response})
        }
      })
    ]
  }
})

export default {init, declare, update}
