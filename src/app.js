// import Type from 'union-type'
import curry  from 'ramda/src/curry'
import merge  from 'ramda/src/merge'
import concat from 'ramda/src/concat'
import h      from 'react-hyperscript'

import SplitView     from 'src/split-view'
import FollowingList from 'src/following-list'
import StarList      from 'src/star-list'

import 'styles/app'

const init = () => {
  return {
    selected: null,
    stars: StarList.init(),
    following: FollowingList.init()
  }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'select_user':
      return merge(state, {
        selected: action.id,
        stars: StarList.init()
      })
    case 'star_action':
      return merge(state, {
        stars: StarList.update(state.stars, action.action)
      })
    case 'following_action':
      return merge(state, {
        following: FollowingList.update(state.following, action.action)
      })
    default:
      return state
  }
})

const effects = curry((dispatch, state) => {
  const starDispatch = (action) => dispatch({type: 'star_action', action})
  const followingDispatch = (action) => dispatch({type: 'following_action', action})

  const emptyStarList = {
    html: h('div.nothing', 'Please select a user from the list on the left.'),
    http: []
  }
  const stars = state.selected ? StarList.effects(starDispatch, state.stars) : emptyStarList
  const following = FollowingList.effects(followingDispatch, state.following, {
    selected: state.selected,
    select: (id) => (id !== state.selected ? dispatch({type:'select_user', id}) : null)
  })

  return {
    html: SplitView({
      sidebar: following.html,
      content: stars.html
    }),
    http: concat(stars.http.map((fragment) => fragment(state.selected)), following.http)
  }
})

export default {init, update, effects}
