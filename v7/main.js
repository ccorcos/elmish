
const giphy = {
  init: () => {
    url: undefined,
    error: false,
    loading: true,
  },
  update: (state, action) => {
    switch (action.type) {
      case 'new':
        return {
          url: action.payload.image_url,
          error: false,
          loading: false,
        }
      case 'error':
        return {
          url: undefined,
          error: true,
          loading: false,
        }
      case 'another':
        return {
          url: undefined,
          error: false,
          loading: true,
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state) => {
    const another = partial(dispatch, {type: 'another'})
    return h('div.giphy', [
      state.loading ? 'Loading...' :
        state.error ? 'ERROR' :
        h('img', {src: state.url}),
      h('button', {
        onClick: another, disabled:state.loading
      }, 'another gif please!')
    ])
  },
  http: (dispatch, state) => {
    const onSuccess = forward(dispatch, 'new')
    const onError = partial(dispatch, {type: 'error'})
    return !state.loading : false :
      h('http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&&rating=pg&tag=explosions', {
        method: 'get',
        onSuccess,
        onError
      })
  }
}
```
