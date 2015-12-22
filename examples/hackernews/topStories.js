import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'

import Item from 'elmish/examples/hackernews/storyItem'

const HN = (ql, spec) => {
  return merge({
    url: 'http://www.graphqlhub.com/graphql',
    method: 'post',
    headers: {
      'Content-Type': 'application/graphql'
    },
    body: ql,
  }, spec)
}

const init = () => {
  return {
    data: null,
    error: null,
    pending: true
  }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'new_data':
      return merge(state, {
        data: action.data,
        error: null,
        pending: false
      })
    case 'error': {
      return merge(state, {
        data: null,
        error: action.error.message,
        pending: false
      })
    }
    case 'refresh': {
      return merge(state, {
        data: null, 
        error: null,
        pending: true
      })
    }
    default:
      return state
  }
})

const declare = curry((dispatch, state) => {
  console.log("here", state)
  return {
    html: state.error ? h('div.error', state.error) :
          state.pending ? h('div.loading', 'loading...') : 
          h('div.top-stories', state.data.map(story => Item.declare.html(story))),
    http: !state.pending ? [] : [
      HN(`
        
        {
          graphQLHub
          hn {
            topStories(limit: 20) {
              ${Item.declare.fragment}
            }
          }
        }

      `, {
        onSuccess: (result) => dispatch({type:'new_data', data: result.json.data.hn.topStories}),
        onError: (error) => dispatch({type:'error', error})
      })
    ]
  }
})

export default {init, declare, update}
