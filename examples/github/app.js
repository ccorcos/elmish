// import Type from 'union-type'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import map from 'ramda/src/map'
import concat from 'ramda/src/concat'
import h from 'react-hyperscript'

import SplitView from 'elmish/examples/github/splitView'
import FollowingList from 'elmish/examples/github/followingList'
import StarList from 'elmish/examples/github/starList'

import 'elmish/examples/github/styles/app.styl'

const init = () => {
  return {
    selected: null,
    starState: StarList.init(),
    followingState: FollowingList.init()
  }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'select_user':
      // when we select a new user, we should initialize a new starList state.
      return merge(state, {
        selected: action.id,
        starState: StarList.init()
      })
    case 'star_action':
      return merge(state, {
        starState: StarList.update(state.starState, action.action)
      })
    case 'following_action':
      return merge(state, {
        followingState: FollowingList.update(state.followingState, action.action)
      })
    default:
      return state
  }
})

const declare = curry((dispatch, state) => {
  const starDispatch = (action) => dispatch({type: 'star_action', action})
  const followingDispatch = (action) => dispatch({type: 'following_action', action})

  const emptyStarList = {
    html: h('div.nothing', 'Please select a user from the list on the left.'),
    http: []
  }
  const starEffects = state.selected ?
    StarList.declare(starDispatch, state.starState) : emptyStarList

  const followingEffects = FollowingList.declare(followingDispatch, state.followingState, {
    selected: state.selected,
    select: (id) => (id !== state.selected ? dispatch({type:'select_user', id}) : null)
  })

  // Remember, starList's http effect returns a fragment so we need to make sure
  // it gets the proper username to fetch.

  const setSelectedUserFrament = (fragment) => fragment(state.selected)

  return {
    html: SplitView({
      sidebar: followingEffects.html,
      content: starEffects.html
    }),
    http: concat(map(setSelectedUserFrament, starEffects.http), followingEffects.http)
  }
})

export default {init, update, declare}
