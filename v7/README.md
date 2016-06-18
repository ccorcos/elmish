# Elmish

A component is just a basic state machine. For example:

```js
const counter = {
  init: () => {
    return {
      count: 0
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'increment':
        return {
          count: state.count + 1
        }
      case 'decrement':
        return {
          count: state.count - 1
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state) => {
    const increment = () => dispatch({type: 'increment'}),
    const decrement = () => dispatch({type: 'decrement'}),
    return h('div.counter', [
      h('button.dec', {onClick: decrement}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: increment}, '+')
    ])
  }
}
```

This is fundamentally what a UI component is...

One code smell is how actions involve string comparison. We can refactor this
to use a creation function. We can also use Ramda for a nice point-free style
of defining the update.

```js
const counter = create({
  init: {
    count: 0,
  },
  update: {
    inc: R.evolve({ count: R.inc }),
    dec: R.evolve({ count: R.dec }),
  },
  view: (action, state) => {
    return h('div.counter', [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  },
})
```

Now lets see how you create a pair of independent counters that reuses the
counter component above.

```js
const counterPair = {
  init: () => {
    counter1: counter.init(),
    counter2: counter.init(),
  },
  update: (state, action) => {
    switch (action.type) {
      case 'counter1':
        return {
          counter1: counter.update(state.counter1, action.action),
          counter2: state.counter2,
        }
      case 'counter2':
        return {
          counter1: state.counter1,
          counter2: counter.update(state.counter2, action.action),
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state) => {
    const dispatchCounter1 = (action) => dispatch({type: 'counter1', action})
    const dispatchCounter2 = (action) => dispatch({type: 'counter2', action})
    return h('div.counter-pair', [
      counter.view(dispatchCounter1, state.counter1),
      counter.view(dispatchCounter2, state.counter2),
    ])
  }
}
```

There are a few directions we can go from here that demonstrate some useful
things.

(1) You might notice that we can refactor this into a generic higher-order
function that can generate a pair of any type of component.

```js
const pairOf = (kind) => {
  return {
    init: () => {
      kind1: kind.init(),
      kind2: kind.init(),
    },
    update: (state, action) => {
      switch (action.type) {
        case 'kind1':
          return {
            kind1: kind.update(state.kind1, action.action),
            kind2: state.kind2,
          }
        case 'kind2':
          return {
            kind1: state.kind1,
            kind2: kind.update(state.kind2, action.action),
          }
        default:
          throw new TypeError('Unknown action', action)
      }
    },
    view: (dispatch, state) => {
      const dispatch1 = (action) => dispatch({type: 'kind1', action})
      const dispatch2 = (action) => dispatch({type: 'kind2', action})
      return h('div.pair', [
        kind.view(dispatchCounter1, state.kind1),
        kind.view(dispatchCounter2, state.kind2),
      ])
    }
  }
}

const counterPair = pairOf(counter)
```

(2) We could easily make the two dependent counters that mirror each other as well.

```js
const dependentCounterPair = {
  init: counter.init
  update: counter.update
  view: (dispatch, state) => {
    return h('div.counter-pair', [
      counter.view(dispatch, state),
      counter.view(dispatch, state),
    ])
  }
}
```

And if you're clever, you might notice that Ramda can help us refactor this.

```js
const dependentCounterPair = R.evolve({
  view: (view) => (dispatch, state) => {
    return h('div.pair', [
      view(dispatch, state),
      view(dispatch, state),
    ])
  }
}, counter)
```

And we can make it a generic higher-order function as well.

```js
const dependentPairOf = R.evolve({
  view: (view) => (dispatch, state) => {
    return h('div.pair', [
      view(dispatch, state),
      view(dispatch, state),
    ])
  }
})

const dependentCounterPair = dependentPairOf(counter)
```

(3) You may also want to customize the counters. There are a couple approaches you
could use here. One way to do it is with a component factory that pumps out
customized components. For example, maybe we want to customize the color of
the font of the counter.

```js
const colorCounter = (color) => create({
  init: {
    count: 0,
  },
  update: {
    inc: R.evolve({ count: R.inc }),
    dec: R.evolve({ count: R.dec }),
  },
  view: (action, state) => {
    return h('div.counter' {style: {color}}, [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  },
})
```

We can modify `pairOf` to take in two components so we can render each of them.

```js
const bothOf = (kind1, kind2) => {
  return {
    init: () => {
      kind1: kind1.init(),
      kind2: kind2.init(),
    },
    update: (state, action) => {
      switch (action.type) {
        case 'kind1':
          return {
            kind1: kind1.update(state.kind1, action.action),
            kind2: state.kind2,
          }
        case 'kind2':
          return {
            kind1: state.kind1,
            kind2: kind2.update(state.kind2, action.action),
          }
        default:
          throw new TypeError('Unknown action', action)
      }
    },
    view: (dispatch, state) => {
      const dispatch1 = (action) => dispatch({type: 'kind1', action})
      const dispatch2 = (action) => dispatch({type: 'kind2', action})
      return h('div.pair', [
        kind.view1(dispatchCounter1, state.kind1),
        kind.view2(dispatchCounter2, state.kind2),
      ])
    }
  }
}

const redCounter = colorCounter('red')
const blueCounter = colorCounter('blue')
const redAndBlueCounters = bothOf(redCounter, blueCounter)
```

This isn't always the best choice though because sometimes you want the
properties of your component to be set dynamically. For example, maybe you want
the count of one counter to determine the amount the other counter changes by.
To do this, we'll use props.

```js
const dynamicCounter = {
  init: () => {
    return {
      count: 0,
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'inc':
        return {
          count: state.count + action.delta
        }
      case 'dec':
        return {
          count: state.count - action.delta
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state, props) => {
    const inc = () => dispatch({type: 'inc', delta: props.delta}),
    const dec = () => dispatch({type: 'dec', delta: props.delta}),
    return h('div.counter', [
      h('button.dec', {onClick: dec}, `-${props.delta}`),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: inc}, `+${props.delta}`)
    ])
  }
}

const customCounter = {
  init: () => {
    return {
      count: dynamicCounter.init(),
      delta: dynamicCounter.init(),
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'count':
        return {
          count: dynamicCounter.update(state.count, action.action),
          delta: state.delta,
        }
      case 'delta':
        return {
          count: state.count,
          delta: dynamicCounter.update(state.delta, action.action),
        }
      default:
        throw new TypeError('Unknown action', action)
    }
  },
  view: (dispatch, state, props) => {
    const dispatchCount = (action) => dispatch({type: 'count', action}),
    const dispatchDelta = (action) => dispatch({type: 'delta', action}),
    return h('div.custom-counter', [
      "Here's your custom counter:",
      dynamicCounter.view(dispatchCount, state.count, {delta: state.delta.count}),
      'Change the counter delta with this counter:',
      dynamicCounter.view(dispatchDelta, state.delta, {delta: 1}),
    ])
  }
}
```

We might want to refactor this again, but let's worry about that later because
we aren't going to be building components manually like this for long.

An important topic to talk about next is performance. Right now, we're
generating the entire virtual dom and diffing the entire virtual dom every time
there's an action. That means there's a lot of unnecessary computation. For
example, if counter1 changes in the counter pair, there's no need to recompute
and diff the virtual dom for counter2. We solve this problem by introducing
laziness, and specific to this problem, lazy trees.

React already does this for us too by creating a "thunk" using
`React.createElement(Component, props)`. React will diff the current props with
the previous props to see if anything changed. If the props and the component
are the same, then we know that entire branch of the tree is the same and we can
skip over diffing that part of the dom.

If we are using React as our rendering library, we can simply wrap our view with
a higher order function that will generate a lazy React component.

```js
const Lazy = React.createClass({
  propTypes: {
    render: React.PropTypes.func.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    state: React.PropTypes.object.isRequired,
    props: React.PropTypes.object,
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return R.equals(nextProps, this.props)
  },
  render: function() {
    return this.props.render(this.props.dispatch, this.props.state, this.props.props)
  }
})

const lazy = (render) => (dispatch, state, props) => {
  return h(Lazy, {render, dispatch, state, props})
}
```

Ramda's `equals` function is really nice because it first checks for referential
equality. Then it checks to see if the inputs have a `.equals` method. And if
it still hasn't determined equality, it tries to do a deep value-comparison.

Now we can just use this lazy function to wrap our view functions!

```js
  // ...
  // dynamicCounter
  view: lazy((dispatch, state, props) => {
    const inc = () => dispatch({type: 'inc', delta: props.delta}),
    const dec = () => dispatch({type: 'dec', delta: props.delta}),
    return h('div.counter', [
      h('button.dec', {onClick: dec}, `-${props.delta}`),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: inc}, `+${props.delta}`)
    ])
  })
  // ...
  // customCounter
  view: lazy((dispatch, state, props) => {
    const dispatchCount = (action) => dispatch({type: 'count', action}),
    const dispatchDelta = (action) => dispatch({type: 'delta', action}),
    return h('div.custom-counter', [
      "Here's your custom counter:",
      dynamicCounter.view(dispatchCount, state.count, {delta: state.delta.count}),
      'Change the counter delta with this counter:',
      dynamicCounter.view(dispatchDelta, state.delta, {delta: 1}),
    ])
  })
  // ...
```

But we're not quite done. This won't actually work yet because the dispatch
functions passed down to the dynamicCounter get new references every time.

TODO: efficiently computing these diffs using immutable js
TODO: issues with dispatch changing reference on every render


TODO: other declarative services
TODO: static schema definition
TODO: publications
