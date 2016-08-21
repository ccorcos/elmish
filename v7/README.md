# TODO

- use objects rather than positional arguments as things start to get more an more complex

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

This is fundamentally what a UI component is. Everything throughout the rest of
this article is just going to be building on top of this concept.

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
        kind1.view(dispatch1, state.kind1),
        kind2.view(dispatch2, state.kind2),
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
    const inc = () => dispatch({type: 'inc', delta: props.delta})
    const dec = () => dispatch({type: 'dec', delta: props.delta})
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
    const dispatchCount = (action) => dispatch({type: 'count', action})
    const dispatchDelta = (action) => dispatch({type: 'delta', action})
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
    const inc = () => dispatch({type: 'inc', delta: props.delta})
    const dec = () => dispatch({type: 'dec', delta: props.delta})
    return h('div.counter', [
      h('button.dec', {onClick: dec}, `-${props.delta}`),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: inc}, `+${props.delta}`)
    ])
  })
  // ...
  // customCounter
  view: lazy((dispatch, state, props) => {
    const dispatchCount = (action) => dispatch({type: 'count', action})
    const dispatchDelta = (action) => dispatch({type: 'delta', action})
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

To solve this issue, we essentially need to be able to partially apply a
function while maintaining a record of the original function and what arguments
it has been partially applied with so we can compare them. I call this concept
"partially applied function equality", and its analogous to the concept of
value-equality for objects.

Here's an example of of a function for partially applying a function with
arguments, returning a new function that has a `.equals` function for
value-comparison which Ramda will use.

```js
const partial = (fn, ...args) => {
  let _fn = (...more) => {
    return R.apply(fn, R.concat(args, more))
  }
  _fn.fn = fn
  _fn.args = args
  _fn.equals = (fn2) => {
    return R.equals(fn2.fn, _fn.fn) &&
           R.equals(fn2.args, _fn.args)
  }
  return _fn
}
```

Now we can use this to maintain partially applied function equality. For
example:

```js
// BEFORE
const dec = () => dispatch({type: 'dec', delta: props.delta})
// AFTER
const dec = partial(dispatch, {type: 'dec', delta: props.delta})
```

We can also use this partial function to create a function that forwards actions
while maintaining partially applied function equality.

```js
const _forward = (dispatch, type, action) => {
  return dispatch({type, action})
}

const forward = (dispatch, type) => {
  return partial(_forward, dispatch, type)
}
```

And here's the change result:

```js
// BEFORE
const dispatchCount = (action) => dispatch({type: 'count', action})
// AFTER
const dispatchCount = forward(dispatch, 'count')
```

This is all a trade-off though. The deeper you are in your view, the more times
the dispatch function will have been partially applied, making the comparison
more and more expensive. So in some circumstances, it may be more performant to
simply recompute and diff your `counter` component rather than compute the
value-equality of the dispatch function.

Another performance consideration is immutability. Comparing that state objects
is very performant when you simply do a referential equality. You can use
Ramda's functions like `R.merge` and `R.evolve` to immutably update state, but
in large applications with large states, this can lead to "garbage thrashing".
In that case, you may find it more performant to use something like ImmutableJS.

Moving on, the next thing I want to talk about are side-effects. Rendering to
the DOM is a side-effect. Thus, I don't see any reason we shouldn't treat all
side-effects this exact same way -- by building a lazy tree of declarative data
structures with callback hooks to asynchronously execute actions.

But first, lets look into more detail how the elmish core works, and how
rendering works. The ugly way of doing it looks like this:

```js
const start = ({init, update, view}, node) => {
  let state = app.init()
  // when we get an action, we want to update the state and re-render the ui
  const dispatch = action => {
    state = app.update(state, action)
    ReactDOM.render(app.view(dispatch, state), node)
  }
  // the initial render
  ReactDOM.render(app.view(dispatch, state), node)
}
const root = document.getElementById('root')
start(customCounter, root)
```

But using a simple streams library like flyd, we can write it much cleaner:

```js
const start = ({init, update, view}, node) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(app.update, app.init(), action$)
  // handle rendering side-effect
  const vdom$ = flyd.map(partial(app.view, action$), state$)
  const render = vdom => ReactDOM.render(vdom, node)
  flyd.on(render, vdom$)
}
```

Now what if we could handle all side-effects the same way? We might handle http
side-effects like this:

```js
const start = ({init, update, view}, node) => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(app.update, app.init(), action$)
  // handle rendering side-effect
  const vdom$ = flyd.map(partial(app.view, action$), state$)
  const render = vdom => ReactDOM.render(vdom, node)
  flyd.on(render, vdom$)
  // handle http side-effect
  const http$ = flyd.map(partial(app.http, action$), state$)
  const resolve = http => HttpService.resolve(http)
  flyd.on(resolve, http$)
}
```

In this case, `HttpService` maintains a mutable state of all requests. It parses
the declarative lazy tree representation of all the HTTP requests of the app,
and fires off any requests that aren't already in flight. And when a request
comes back, HttpService will fire the associated callback function.

Here's a component that fetched a random gif from Giphy using this declarative
HTTP "service".

```js
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

Notice how we're using the same exact helper function to generate declarative
http requests objects as we are to generate virtual dom nodes! That's because
they're the same exact concept! We're just creating lazy trees, and we're
offloading all the hard work onto "services" like React to diff the trees and
handle mutations.

Now lets see how this changes our "bothOf" function:

```js
const bothOf = (kind1, kind2) => {
  return {
    // ...
    http: (dispatch, state) => {
      const dispatch1 = (action) => dispatch({type: 'kind1', action})
      const dispatch2 = (action) => dispatch({type: 'kind2', action})
      return h([
        kind1.http(dispatch1, state.kind1),
        kind2.http(dispatch2, state.kind2),
      ])
    },
    // ...
  }
}

const doubleGiphy = bothOf(giphy, giphy)
```

All we did here was create a lazy node that references two other lazy nodes, one
for each child. Then we used `bothOf` two create a double-giphy component for
twice the amount of entertainment.

Another side-effect we might be interested in is hotkeys -- so we can bind
keystrokes to actions in our components. For example, maybe we want the spacebar
to trigger another gif.

```js
const giphy = {
  // ...
  hotkeys: (dispatch, state) => {
    const another = partial(dispatch, {type: 'another'})
    return h({
      space: another
    })
  },
  // ...
}
```

The problem we're starting to run into now is that every time we want to create
a new side-effect service, we need to rewire our entire app. That is, I need to
add a hotkeys function to `bothOf` if any of its children want to use that
service. That makes it really hard to make a generic / generalizable component
since we don't know beforehand what services a components child are going to use
and how to join them in a reasonable way.

Thus, we introduce a concept of a schema to offload all this work on the
service itself. Lets rewrite the `bothOf` function using a schema. Its actually
pretty simple.


```js
const bothOf = (kind1, kind2) => {
  return {
    schema: {
      kind1,
      kind2
    },
  }
}
```

And now, in the `start` function, we can look at the schema and deduce some sane
defaults for merging everything together. The following init and update
functions are interred from the schema above.

```js
  init: () => {
    kind1: kind1.init(),
    kind2: kind2.init(),
  }
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
  }
```

And services can define their own default merge strategy. For example, the
default for a React service is to wrap the child components in a div.

```js
  view: (dispatch, state) => {
    const dispatch1 = (action) => dispatch({type: 'kind1', action})
    const dispatch2 = (action) => dispatch({type: 'kind2', action})
    return h('div', [
      kind1.view(dispatch1, state.kind1),
      kind2.view(dispatch2, state.kind2),
    ])
  }
```

Services are now free to parse through the schema and infer all of this for us
now that we're defining a static schema. But there are couple hangups we have
to deal with first.

(1) Sometimes you might want override the default merging functionality. This is
most frequently the case when you're writing the view function with exotic
functionality. But you'll rarely find yourself doing this for http requests.
Here's how we'd rewrite the customCounter.

```js
const customCounter = {
  schema: {
    count: dynamicCounter,
    delta: dynamicCounter,
  }
  view: ({count, delta}, state) => {
    return h('div.custom-counter', [
      "Here's your custom counter:",
      count.view(state.count, {delta: state.delta.count}),
      'Change the counter delta with this counter:',
      delta.view(state.delta, {delta: 1}),
    ])
  }
}
```

Notice that we didn't have to deal with dispatch or partially applied function
equality at all! Since we know the schema, the `start` function can do all of
that for you.

Now suppose we modify our counter so that we can use the + and - keys to
increment and decrement the counter.

```js
const counter = {
  //...
  hotkeys: (dispatch, state) => {
    return h({
      '+': partial(dispatch, {type:'increment'}),
      '-': partial(dispatch, {type:'decrement'}),
    })
  }
  //...
}
```

But now we're creating these actions for each side-effect and dealing with PAFE
again. We can pretty easily refactor this with a helper function so that we
don't need to deal with PAFE or duck-typing.

```js
const counter = helper({
  update: {
    increment: (state) => ({count: state.count + 1}),
    increment: (state) => ({count: state.count - 1}),
  },
  view: (actions, state) => {
    return h('div.counter', [
      h('button.dec', {onClick: actions.decrement}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: actions.increment}, '+')
    ])
  }
})
```

Cool, but now whenever we press +, both counters increment in our custom counter
but we don't want the delta counter to increment using hotkeys. So we might
override the default functionality and only pass on the main counter's hotkeys
to `start`.

```js
const customCounter = {
  // ...
  hotkeys: ({count, delta}, state) => {
    return count.hotkeys(state.count)
  }
  // ...
}
```

Awesome. Now + and - only changes the main counter. We're only beginning to see
the expressiveness of this pattern.

(2) Some components may have more complicated relationships between the state
and its subcomponents. Two such examples are the `listOf` higher-order component
and the `undoable` higher-order component.

The `listOf` component creates an arbitrary list of components along with
buttons to add and remove components from the list. Thus the schema is no longer
static, but rather a function of the current state for the component. The data
structure returned from the schema determines the structure of the children
object passed into the side-effect functions. We do this by specifying a `Child`
which is defined by a component type and a lens for querying and mutating state.
When defining a dynamic schema like this, you need to define the initial state
yourself.

```js
const listOf = (kind) => {
  return {
    init: () => {
      return {
        nextId: 1,
        items: [{
          id: 0,
          state: kind.init()
        }]
      }
    },
    schema: (state, tag) => {
      return {
        items: state.items.map((item) => {
          return tag({
            type: kind,
            getter: R.pipe(
              R.prop('items'),
              R.find(R.propEq('id', item.id)),
              R.prop('state')
            ),
            setter: (v, s) => R.evolve({
              items: R.updateWhere(R.propEq('id', item.id), v)
            })(s)
          })
        })
      }
    },
    update: {
      insert: (state) => {
        return {
          nextId: state.nextId + 1,
          items: R.append({
            id: state.nextId,
            state: kind.init()
          }, items)
        }
      },
      remove: (state, id) => {
        return R.evolve({
          items: R.filter(R.propNeq('id', id))
        })
      }
    },
    view: ({items}, {insert, remove}, state) => {
      return h('div.list-of', [
        h('button.insert', {onClick: insert}, '+'),
        state.list.map((item) => {
          return (
            h('div.item', {key:item.id}, [
              item
              h('button.remove', {onClick: partial(remove, item.id})}, 'x')
            ])
          )
        })
      ])
    }
  }
}
```

Ironically, we didn't really end up writing less code than before. But we didn't
have to deal with passing child actions through update, and we only has to use
`partial` in one place where it really makes sense. But the real benefit is that
we can now parse a static component tree as a function of state. More on this
later... First, I want to show you another example with `undoable`.

```js
const undoable = (kind) => {
  return {
    init: {
      list: [kind.init()],
      time: 0
    },
    schema: (state, tag) => {
      return {
        child: tag({
          type: kind,
          getter: R.pipe(
            R.prop('list'),
            R.nth(state.time)
          ),
          setter: (v, s) => R.evolve({
            list: R.update(state.time, v)
          })(s)
        })
      }
    },
    update: {
      undo: evolve({
        time: R.dec
      }),
      redo: evolve({
        time: R.inc
      }),
      child: (state, action) => {
        const past = take(state.time, state.list)
        const current = state.list[state.time]
        const next = kind.update(current, action)
        return merge(state, {
          list: concat(past, [current, next]),
          time: state.time + 1
        })
      }
    },
    view: ({child}, {undo, redo}, state) => {
      const canUndo = state.time > 0
      const canRedo = state.time < state.list.length - 1
      return h('div', [
        h('button', {onClick: undo, disabled: !canUndo}, 'undo'),
        h('button', {onClick: redo, disabled: !canRedo}, 'redo'),
        child.view()
      ])
    }
  }
}
```

The thing about the above example is that focus of the lens changes on every state!
Pretty interesting... Also, we've overridden the child update function based on the key-value.

Features thus far:

- actions, action payloads, action transforms (not actually demonstrated yet, e.g. e.target.value)
- schemas, PAFE, overriding side-effects and child actions




TODO


- how to build a the http service
  - how does the h helper work?
- motivation for publication concept
  - lenses and performance
  - what about dispatching global actions?
- graphql higher order component
- http caching higher order component
- optimistic updates and fallback


```js
function PAF(f, args...) {
  this.f = f
  this.args = args
}

function mapper(g, f, args) {
  return g(f(...args))
}

PAF.prototype.map = function(g) {
  return new PAF(mapper, g, this.f, this.args)
}

PAF.prototype.partial = function(more...) {
  return new PAF(this.f, this.args.concat(more))
}

PAF.prototype.equals = function(other) {
  return R.equals(other.f, self.f) && R.equals(other.args, self.args)
}

PAF.prototype.call = function(more...) {
  return this.f(...args)
}
```
