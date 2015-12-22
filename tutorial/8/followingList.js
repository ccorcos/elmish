// This component displays a list of github users that "ccorcos" follows. Note
// that ccorcos is hardcoded in this example.

import github from 'elmish/tutorial/8/github'
import curry  from 'ramda/src/curry'
import merge  from 'ramda/src/merge'
import h      from 'react-hyperscript'

import 'elmish/tutorial/8/styles/followingList.styl'

const init = () => {
 return { following: [], pending: true, error: false}
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'following':
      return merge(state, {
        following: action.following,
        pending: false,
        error: false
      })
    case 'error':
      console.warn("ERROR:", state, action)
      return merge(state, {
        following: [],
        pending: false,
        error: action.error
      })
    default:
      return state
  }
})

let declare = curry((dispatch, state, {selected, select}) => {
  const item = (user) => {
    return (
      h('div.user' + (user.login === selected ? '.selected' : ''), {
        onClick: () => select(user.login)
      }, [
        h('img', {src: user.avatar_url}),
        h('span.name', user.login)
      ])
    )
  }

  return {
    html:
      state.pending   ? 'loading...' :
      state.error     ? state.error  :
      state.following ? state.following.map(item) :
      console.warn("this should never happen"),
    http: !state.pending ? [] : [
      github.following('ccorcos', {
        onSuccess: (response) => {
          return dispatch({type: 'following', following: response.json})
        },
        onError: (response) => {
          return dispatch({type: 'error', error: response})
        }
      })
    ]
  }
})

export default {init, declare, update}
