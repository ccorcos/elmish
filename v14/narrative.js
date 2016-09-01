// So here's a a simple Counter component. Its pure and its functional :)

const Counter = {
  init: () => ({
    count : 0,
  }),
  update: (state, action, payload) => {
    switch(action) {
      case 'inc':
        return { count: state.count + 1 }
      case 'dec':
        return { count: state.count - 1 }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  view: (dispatch, state, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec')}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc')}, '+'),
    ])
  }
}

// You can start the application like this:

const {lift, start} = configure([
  react(document.getElementById('root')),
])

start(Counter)

// What we did was configure the react plugin and then start it all up! Now,
// what if you want to display two counters?

const Counter1 = lift(['counter1'], Counter)
const Counter2 = lift(['counter2'], Counter)

const CounterPair = {
  children: [Counter1, Counter2]
  view: (dispatch, state, props) => {
    return h('div.counter-pair', [
      Counter1.view(dispatch, state, props),
      Counter2.view(dispatch, state, props),
    ])
  }
}

// `lift` is a neat little function. You give it a path and a component and it
// gives you a new component that looks for its own state on that path and also
// sends actions that are prefixed with that path.

// A component with children can have logic of its own as well.

const noop = () => noop

const CounterPair = {
  children: [Counter1, Counter2]
  init: () => ({
    on: true,
  }),
  update: (state, action, payload) => {
    switch (action) {
      case 'toggle':
        return {
          on: !state.on,
        }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  view: (dispatch, state, props) => {
    return h('div.counter-pair', [
      h('button', {onClick: dispatch('toggle')}, state.on ? 'on' : 'off')
      Counter1.view(state.on ? dispatch : noop, state, props),
      Counter2.view(state.on ? dispatch : noop, state, props),
    ])
  }
}

// What we've effectively done here is add a toggle button that lets you
// control whether or not the counters can dispatch actions and thus count.
// Note that all the state initialization and updates for the children
// are wired up for you without having to do anything. However, you can
// override this stuff if you want. Here's the exact same functionality using
// overrides instead.

const CounterPair = {
  children: [Counter1, Counter2]
  _init: () => ({
    on: true,
    counter1: Counter1.init(),
    counter2: Counter2.init(),
  }),
  _update: (state, action, payload) => {
    if (isLiftedAction(action)) {
      switch (unliftAction(action)) {
        case 'counter1':
          return Counter1.update(state, action, payload)
        case 'counter2':
          return Counter2.update(state, action, payload)
        default:
          throw new TypeError(`Unknown action type: ${action}`)
      }
    } else {
      switch (action) {
        case 'toggle':
          return {
            on: !state.on,
          }
        default:
          throw new TypeError(`Unknown action type: ${action}`)
      }
    }
  },
  view: (dispatch, state, props) => {
    return h('div.counter-pair', [
      h('button', {onClick: dispatch('toggle')}, state.on ? 'on' : 'off')
      Counter1.view(state.on ? dispatch : noop, state, props),
      Counter2.view(state.on ? dispatch : noop, state, props),
    ])
  }
}

// The importing thing to notice here is that Counter1.update knows how to view
// its relevant state and unlift the action based on the path it was provided
// when it was lifted.

// You can continue to abstract components by lifting them to infinitum

const CounterPair1 = lift(['counterPair1'], CounterPair)
const CounterPair2 = lift(['counterPair2'], CounterPair)

const CounterPair = {
  children: [CounterPair1, CounterPair2]
  view: (dispatch, state, props) => {
    return h('div.counter-pair', [
      CounterPair1.view(dispatch, state, props),
      CounterPair2.view(dispatch, state, props),
    ])
  }
}

// If you put a console.log in the view function for the Counter component,
// you'll notice that the only Counter that re-renders is the counter that
// changed. That's because we're lazily constructing the component heirarchy
// and wrapping the view function in a React component with a special comparison
// in `componentShouldUpdate(nextProps)`.

// Next, lets take a look at this dispatch function. Its designed in such a way
// that we can compare partially applied dispatch functions without having to
// burden the developer with knowing how this works. So suppose you want to
// have a counter that gets as props the amount it should increment or decrement
// by. Here's how you might build it:

const DeltaCounter = {
  init: () => ({
    count : 0,
  }),
  update: (state, action, payload) => {
    switch(action) {
      case 'inc':
        return { count: state.count + payload }
      case 'dec':
        return { count: state.count - payload }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  view: (dispatch, state, props) => {
    return h('div.counter', [
      h('button.dec', {onClick: dispatch('dec', props.delta)}, '-'),
      h('span.count', state.count),
      h('button.inc', {onClick: dispatch('inc', props.delta)}, '+'),
    ])
  }
}

// All we did was add the payload as the second argument to dispatch. Now
// suppose we want to transform the data we're getting from dispatch. We can
// do this by passing a function as the second argument. Here's an example of
// a login form:

const targetValue = (e) => e.target.value

const Login = {
  init: () => ({
    username: '',
    password: '',
  }),
  update: (state, action, payload) => {
    switch(action) {
      case 'username':
        return {
          ...state,
          username: payload,
        }
      case 'password':
        return {
          ...state,
          password: payload,
        }
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  view: (dispatch, state, props) => {
    return h('div.counter', [
      h('input', {type: 'text', value: state.username, onChange: dispatch('username', targetValue)}),
      h('input', {type: 'password', value: state.password, onClick: dispatch('password', targetValue)}),
      h('button', {onClick: partial(props.onSubmit, state)}, 'submit')
    ])
  }
}

// The partial helper function is not entirely necessary in this case, but if
// we were partially applying this function and passing it down as props to a
// child that wasn't a DOM element, then we'd need to re-render that component
// every single time since its a new function. However, `partial` magically
// allows Elmish to compare these partially applied functions so that we can
// lazily evaluate these component trees!

// Elmish really starts to shine when it comes to abstraction. For example,
// suppose you want to add undo/redo support to your application. You can
// do this all with a single higher-order component.

const undoable = (kind) => {
  return {
    children: (state) => [
      lift(['states', state.time], kind),
    ],
    _init: () => {
      return {
        time: 0,
        states: [
          kind.init(),
        ],
      }
    },
    _update: (state, action, payload) => {
      switch(action) {
        case 'undo':
          return R.evolve({
            time: R.dec,
          }, state)
        case: 'redo':
          return R.evolve({
            time: R.inc,
          }, state)
        default:
          return R.evolve({
            // increment time
            time: R.inc,
            states: R.pipe(
              // slice out any redo states
              R.slice(0, state.time + 1),
              // update the last state and append it
              list => R.append(
                kind.update(R.last(list), action, payload),
                list
              ),
            )
          })(state)
      }
    },
    view: (dispatch, state, pub, props) => {
      const canUndo = state.time > 0
      const canRedo = state.time < state.states.length - 1
      return h('div', [
        h('button', {onClick: dispatch('undo'), disabled: !canUndo}, 'undo'),
        h('button', {onClick: dispatch('redo'), disabled: !canRedo}, 'redo'),
        kind.view(
          dispatch,
          state.states[state.time],
          props
        )
      ])
    },
  }
}

// This is probably a little hard to follow so I'll try to walk you through
// how it works. The way this works is we have a time and a list of states
// and the time points to the current state. Thus the path to the current
// component changes with every action. So the children are essentialy dynamic,
// that is, a function of state. So anytime the state changes, we look up the
// children here. And whenever you have dynamic children you need to setup
// the initial state using the override. When we're rendering the component,
// we're not actually using the lifted view and do in out override function,
// we can manually update and append the proper state. To use this we just have
// to wrap our component.

start(undoable(CounterPair))

// Another higher-order component is the listOf component which lets you create
// an arbitrary number of the same component.

const listOf = (kind) => {
  const child = (id) => lift(['list', {id}, 'state'], kind)
  return {
    children: state => state.list.map(({id}) => child(id)),
    _init: () => {
      return {
        nextId: 1,
        list: [{
          id: 0,
          state: kind.init(),
        }],
      }
    },
    update: (state, action, payload) => {
      if (action === 'add') {
        return {
          nextId: state.nextId + 1,
          list: state.list.concat([{
            id: state.nextId,
            state: kind.init(),
          }]),
        }
      } else if (action === 'remove') {
        return R.evolve({
          list: R.filter(R.complement(R.propEq('id', payload)))
        }, state)
      } else {
        return state
      }
    },
    view: (dispatch, state, pub, props) => {
      return h('div', [
        h('button', {onClick: dispatch('add')}, '+'),
        state.list.map(item =>
          h('div.item', {key: item.id}, [
            child(item.id).view(dispatch, state),
            h('button', {onClick: dispatch('remove', item.id)}, 'x')
          ])
        )
      ])
    }
  }
}

// Notice here that we truely do have dynamic children. We're overriding the
// init function as usual, but this time we aren't overriding update because
// we don't care to introspect on the state -- we can let Elmish do the overhead
// of wiring everything up for us.

// The other kind of abstract we get from Elmish is with plugins. Notice that
// the entire view layer is handled by the react plugin. The only thing that
// Elmish does at its core is hande init, update, and dispatch.

// One of the most useful plugins is `pubsub`.

const { lift, start } = configure([
  pubsub,
  react(root),
])

// `pubsub` is primarily a middleware -- middleware allows you to transform
// and derive state before passing this information on to drivers. React is
// primarily a driver because it takes a vdom stream and renders it. So here's
// what you get by using pubsub:

const Health = {
  init: () => ({ health: 100 }),
  update: (state, action, payload) => {
    switch(action) {
      case 'hit':
        return R.evolve({
          health: h => Math.min(h - 10, 100),
        }, state)
      case 'potion':
        return R.evolve({
          health: h => Math.min(h + 20, 100),
        }, state)
      default:
        throw new TypeError(`Unknown action type: ${action}`)
    }
  },
  publish: (dispatch, state) => {
    return node({
      hit: dispatch('hit'),
      potion: dispatch('potion'),
      health: state.health,
    })
  }
}

const Dashboard = {
  subscribe: (state, pub) => {
    return node({sub: ['health']})
  }
  view: (dispatch, state, pub, props) => {
    return h('div.dashboard', [
      h('div.health', pub.health)
    ])
  }
}

const Napsack = {
  subscribe: (state, pub) => {
    return node({sub: ['potion']})
  },
  view: (dispatch, state, pub, props) => {
    return h('div.napsack', [
      h('button', {onClick: props.potion}, 'drink potion')
    ])
  }
}

const Game = {
  subscribe: (state, pub) => {
    return node({sub: ['hit']})
  },
  view: (dispatch, state, pub, props) => {
    return h('div.game', [
      h('button', {onClick: props.hit}, 'hit')
    ])
  }
}

const App = {
  children: [Health, Dashboard, Napsack, Game],
  view: (dispatch, state, pub, props) => {
    return h('div.app', [
      Dashboard.view(dispatch, state, pub),
      Napsack.view(dispatch, state, pub),
      Game.view(dispatch, state, pub),
    ])
  },
}

// TODO:
// - pubsub
//   - explain why we wrap the subscriptions and publications in a node
//   - explain how we would override publish or subscribe and how if any of these
//     component were lifted, then this would evaluate lazily.
// - plugins
//   - explain how pubsub works
//   - explain how graphql might work
//   - explain how react works
//   - explain how hotkeys works


// So there are a few interesting pieces here. The react plugin recognized the
// use of the pubsub plugin and provided it as an additional parameter to the
// view function. Components also don't need to render, thus we've entirely
// decoupled rendering from the application logic. Components can also publish
// and subscribe to a global key-value map to separate concerns and decouple
// the UI component heirarchy from the state representation.

// Subscribe gets the entire publication object and lets you narrow down on
// just the keys you want. Under the hood, we're aggregating all the component's
// childrens' subscriptions and merging them so that every component's publication
// contains all the values its children need. Thus we can optimally re-render
// the tree. If we wanted to, we could override with _publish or _subscribe
// and manually hook things up ourselves, but this would involve understanding
// some of the internals of how we lazily aggregate the everything under the
// hood.


