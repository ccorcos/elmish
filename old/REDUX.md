
```js
const Counter = {
  defs: {
    inc: 'inc',
    dec: 'dec',
  },
  actions: {
    inc: () => ({type:'inc'})
  },
  init: {
    count: 0,
  },
  mutate: {
    inc: state => ({...state, count: state.count + 1}),
    dec: state => ({...state, count: state.count - 1}),
  },
  update: self => (state=self.init, action)  => {
    switch (action.type) {
      case self.defs.inc: {
        return self.mutate.inc(state)
      }
      case self.defs.dec: {
        return pipe([
          self.mutate.dec,
          snackbar.mutate.add('Decrement'),
        ], state)
      }
      default:
        return state
    }
  },
  view: props => {
    return (
      <div>
        <button>
      </div>
    )
  }
}
