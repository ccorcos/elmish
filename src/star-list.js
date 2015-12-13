import github  from 'src/github'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'
import pipe    from 'ramda/src/pipe'
import sortBy  from 'ramda/src/sortBy'
import prop    from 'ramda/src/prop'
import reverse from 'ramda/src/reverse'
import map     from 'ramda/src/map'
import __      from 'ramda/src/__'
import h       from 'react-hyperscript'

import 'styles/star-list'

// init : () -> state
const init = () => {
 return { stars: [], pending: true, error: false }
}

// update : (state, action) -> state
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

// effects : (dispatch, state) -> {html, http, ...}
let effects = curry((dispatch, state) => {

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

export default {init, effects, update}
