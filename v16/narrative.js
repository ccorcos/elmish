// Prerequisits:
// - React and controlled inputs
// - Hyperscript
// - Ramda

// Here's a simple counter

const Counter = {
  state: {
    init: () => {
      // init must return an object literal
      return {
        count: 0,
      }
    },
    update: (state, action) => {
      if (action.type === 'inc') {
        return {
          ...state,
          count: state.count + 1,
        }
      }
      if (action.type === 'dec') {
        return {
          ...state,
          count: state.count - 1,
        }
      }
      return state
    },
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
  },
}

// We can simplify things a little bit using Ramda.

const update = (obj) => (state, action) =>
  (obj[action.type] || R.identity)(state, action.payload)

const SimplerCounter = {
  state: {
    init: R.always({count: 0}),
    update: update({
      inc: R.evolve({ count: R.inc }),
      dec: R.evolve({ count: R.dec }),
    })
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
  },
}

// We can add hotkeys to the counter as well.

const HotkeyCounter = {
  state: {
    init: R.always({count: 0}),
    update: update({
      inc: R.evolve({ count: R.inc }),
      dec: R.evolve({ count: R.dec }),
    })
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
    // all side-effects are declarative
    hotkeys: ({dispatch, state}) => {
      return {
        '=': dispatch('inc'),
        '-': dispatch('dec'),
      }
    },
  },
}

// You can also add a payload to dispatch.

const CounterWithPayload = {
  state: {
    init: R.always({count: 0}),
    update: update({
      inc: R.evolve({ count: R.inc }),
      dec: R.evolve({ count: R.dec }),
      incBy: (state, payload) => R.evolve({count: R.add(payload)}, state),
    })
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
    hotkeys: ({dispatch, state}) => {
      return {
        '=': dispatch('inc'),
        '-': dispatch('dec'),
        // payload as the second argument
        '5': dispatch('incBy', 5),
      }
    }
  },
}

// You can also transform the payload with a function.

const targetValue = e => e.target.value

const CustomInput = {
  state: {
    init: R.always({value: ''}),
    update: update({
      onChange: (state, payload) => R.assoc('value', payload, state),
    })
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('input.custom', {
        value: state.value,
        // get the event target value
        onChange: dispatch('onChange', targetValue),
      })
    },
  },
}

// You're encouraged to use "flux standard actions" but you don't have to. This
// can be useful for forms sometimes.

const LoginForm = {
  state: {
    init: R.always({username: '', password: ''}),
    update: (state, action) => {
      if (action.type === 'onChange') {
        return R.assoc(action.field, payload, state)
      }
      return state
    },
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.login-form', [
        h('input.username', {
          type: 'text',
          value: state.username,
          onChange: dispatch({type: 'onChange', field: 'username'}, targetValue),
        }),
        h('input.password', {
          type: 'password',
          value: state.password,
          onChange: dispatch({type: 'onChange', field: 'password'}, targetValue),
        }),
      ])
    },
  },
}

// Components with children get automatically wired up for you.

const LoginCounterApp = {
  children: [CounterWithPayload, LoginForm],
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.login-counter-app', [
        h(CounterWithPayload, {dispatch, state}),
        h(LoginForm, {dispatch, state}),
      ])
    },
  },
}

// Under the hood, we're computing the children init and update methods, and
// creating a lazy tree for all side-effects.

const LoginCounterAppOverride = {
  children: [CounterWithPayload, LoginForm],
  state: {
    _init: () => {
      return {
        ...computeChildInit(CounterWithPayload),
        ...computeChildInit(LoginForm),
      }
    },
    _update: (state, action) => {
      return R.pipe(
        (s) => computeChildUpdate(CounterWithPayload)(s, action),
        (s) => computeChildUpdate(LoginForm)(s, action),
        state
      )
    },
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.login-counter-app', [
        h(CounterWithPayload, {dispatch, state}),
        h(LoginForm, {dispatch, state}),
      ])
    },
    _hotkeys: ({dispatch, state}) => {
      return node([
        lazy({path: ['effects', 'hotkeys'], args: [{dispatch, state}], component: CounterWithPayload}),
        lazy({path: ['effects', 'hotkeys'], args: [{dispatch, state}], component: LoginForm}),
      ])
    },
  },
}

// Components with children can have state as well.

const CounterAppWithState = {
  children: [CounterWithPayload],
  state: {
    init: R.always({on: false}),
    update: update({
      toggle: R.evolve({on: R.not}),
    }),
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.counter-app-with-state', [
        h(CounterWithPayload, {dispatch, state}),
        h('button.toggle', {onClick: dispatch('toggle')}, state.on ? 'on', 'off')
      ])
    },
  },
}

// And when this translates to overrides, its values turn into the node values.

const CounterAppWithStateOverride = {
  children: [CounterWithPayload],
  state: {
    _init: () => {
      return {
        on: false,
        ...computeChildInit(CounterWithPayload),
      }
    },
    _update: (state, action) => {
      return R.pipe(
        (s) => computeChildUpdate(CounterWithPayload)(s, action),
        update({toggle: R.evolve({on: R.not})})(state, action)
      )
    },
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.counter-app-with-state', [
        h(CounterWithPayload, {dispatch, state}),
        h('button.toggle', {onClick: dispatch('toggle')}, state.on ? 'on', 'off')
      ])
    },
  },
}

// You can pass information between components using callback much like dispatch.

const set = (prop, transform=R.identity) => (state, payload) =>
  R.evolve({[prop]: R.always(transform(payload))}, state)

const SecretForm = {
  state: {
    init: R.always({value: ''}),
    update: update({ onChange: set('value') }),
  },
  effects: {
    _react: ({dispatch, state, props}) => {
      return h('div.secret-form', [
        h('input', {
          type: 'password',
          value: state.value,
          onChange: dispatch('onChange', targetValue),
        }),
        h('button', {
          onClick: callback(props.onSubmit, state),
        }, 'submit')
      ])
    },
  },
}

const SecretApp = {
  children: [SecretForm],
  state: {
    init: R.always({secret: undefined}),
    update: update({
      onSubmit: set('secret', R.prop('value')),
    }),
  },
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.secret-app', [
        h(SecretForm, {dispatch, state, props: {onSubmit: dispatch('onSubmit')}}),
        state.secret ? h('span.secret', `Your secret is "${state.secret}"`)
                     : false
      ])
    }
  }
}

// You can dispatch multiple actions at once using batch.

const SecretFormClearOnSubmit = {
  state: {
    init: R.always({value: ''}),
    update: update({
      onChange: set('value'),
      onClear: R.assoc('value', ''),
    }),
  },
  effects: {
    _react: ({dispatch, state, props}) => {
      return h('div.secret-form', [
        h('input', {
          type: 'password',
          value: state.value,
          onChange: dispatch('onChange', targetValue),
        }),
        h('button', {
          onClick: batch([
            callback(props.onSubmit, state),
            dispatch('onClear'),
          ])
        }, 'submit')
      ])
    },
  },
}

// If child components have colliding actions or states, you can nest them.
// Nest changes the way the tree is interpreted and namespaces the actions
// and states for you.

const LoginForm1 = nest('login', LoginForm)
const SecretForm1 = nest('secret', SecretForm)

const LoginWithSecretApp = {
  children: [LoginForm1, SecretForm1],
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.login-with-secret-app', [
        h(LoginForm1, {dispatch, state}),
        h(SecretForm1, {dispatch, state}),
      ])
    },
  },
}

// Now we can create dependent or independent copies of any component or app.

const twoOfDependent = kind => {
  return {
    children: [kind],
    effects: {
      _react: ({dispatch, state}) => {
        return h('div.two-of-dependent', [
          h(kind, {dispatch, state}),
          h(kind, {dispatch, state}),
        ])
      },
    },
  }
}

const twoOfIndependent = kind => {
  const kind1 = nest('kind1', kind)
  const kind2 = nest('kind2', kind)
  return {
    children: [kind1, kind2],
    effects: {
      _react: ({dispatch, state}) => {
        return h('div.two-of-independent', [
          h(kind1, {dispatch, state}),
          h(kind2, {dispatch, state}),
        ])
      },
    },
  }
}

// Nest is fundamentally two different things. You can nest the actions and you
// can nest the state. You can do these things separately if you want.
// In the LoginWithSecretApp, the states didn't actually collide, only the
// actions did, so we could nest only the actions if we wanted.

const LoginForm2 = nestAction('login', LoginForm)
const SecretForm2 = nestAction('secret', SecretForm)

const LoginWithSecretApp2 = {
  children: [LoginForm2, SecretForm2],
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.login-with-secret-app', [
        h(LoginForm2, {dispatch, state}),
        h(SecretForm2, {dispatch, state}),
      ])
    },
  },
}

// You can nest only the state if you want by using a lens for getting and
// setting the state. Nest is just the composition of both nestAction and
// nestState. Using nestState with lensProp on LoginForm2, LoginForm3 is
// effectively the same as LoginForm1.

const LoginForm3 = nestState(R.lensProp('login'), LoginForm2)

// One thing you an do now is add undo/redo buttons to make any component
// undoable.

const nestUndoable = R.pipe(
  nestAction('app'),
  nestState(R.lens(
    // get the state
    state => state.states[state.time],
    // set the state
    (substate, state) => R.evolve({
      time: R.inc,
      states: state.states.slice(0, state.time + 1).concat([substate])
    })
  ))
)

const undoable = (app) => {
  const undoableApp = nestUndoable(app)
  return {
    children: [undoableApp],
    state: {
      _init: () => {
        return {
          time: 0,
          state: [computeInit(undoableApp)],
        }
      },
      update: update({
        undo: R.evolve({ time: R.dec }),
        redo: R.evolve({ time: R.inc }),
      }),
    },
    effects: {
      _react: ({dispatch, state, props}) => {
        const canUndo = state.time > 0
        const canRedo = state.time < state.states.length - 1
        return h('div.undoable', {}, [
          h('button.undo', {
            disabled: !canUndo,
            onClick: canUndo ? dispatch('undo') : undefined
          }, 'undo'),
          h('button.redo', {
            disabled: !canRedo,
            onClick: canRedo ? dispatch('redo') : undefined
          }, 'redo'),
          h(undoableApp, {dispatch, state, props})
        ])
      },
      hotkeys: ({dispatch, state, props}) => {
        const canUndo = state.time > 0
        const canRedo = state.time < state.states.length - 1
        return {
          'cmd z': canUndo ? dispatch('undo') : () => {},
          'cmd shift z': canRedo ? dispatch('redo') : () => {},
        }
      }
    }
  }
}

// Sometimes we want to have a component with dynamic children. This is very
// common when you want to show a dynamic list of something. We can do this
// by making children a function of state and overriding the init method.

const eq = (a, b) => (a && a.equals) ? a.equals(b) : a === b

const nestListOf = (id, app) =>
  R.pipe(
    nestAction({type: 'item', id}),
    nestState(R.lens(
      // get state
      state => state.items.find(R.propEq('id', id)).state,
      // set state
      (substate, state) => state.items.map(item => item.id === id ? {...item, state: substate}, item),
    )),
    // remember the original so we can compare!
    R.assoc('__original', app),
    R.assoc('__id', id),
    // create the comparison function
    R.assoc('equals', (b) => b && eq(b.__original, app) && b.__id === id),
    app
  )

const listOf = app => {
  return {
    children: state => state.items.map(item => nestListOf(item.id, app)),
    state: {
      _init: R.always({
        id: 1,
        items: [{
          id: 0,
          state: computeChildInit(app)
        }]
      }),
      update: update({
        insert: state => R.evolve({
          id: R.inc,
          items: R.append({id: state.id, state: computeInit(app)})
        }, state),
        remove: (state, payload) => R.evolve({
          items: R.filter(R.complement(R.propEq('id', payload))),
        }),
      }),
    },
    effects: {
      _react: ({dispatch, state, props}) => {
        return h('div.list-of', {}, [
          h('button', {onClick: dispatch('insert')}, 'insert'),
          state.items.map(item => {
            return h('div.item', {key: item.id}, [
              h(nestListOf(item.id, app), {state, dispatch, props}),
              h('button', {onClick: dispatch('remove', item.id)}, 'remove'),
            ])
          })
        ])
      },
    },
  }
}

// You can decouple your view hierarchy from your state by using pure functional
// publish and subscribe throughout the application.

const Health = {
  state: {
    init: R.always({health: 100}),
    update: update({
      hit: (state, damage) => R.evolve({health: R.subtract(damage)}, state),
    }),
    publish: (state, dispatch) => {
      return {
        health: state.health,
        // accept a payload
        critical: dispatch('critical', id),
      },
    },
  },
}

const Game = {
  children: [Health],
  state: {
    subscribe: state => {
      return {
        hit: true,
      }
    },
  },
  effects: {
    _react: ({pubs}) => {
      return h('div.button', {onClick: callback(pubs.hit, 10)}, '-10')
    },
  },
}

const Dashboard = {
  state: {
    subscribe: state => {
      return {
        health: true,
      }
    },
  },
  effects: {
    _react: ({pubs}) => {
      return h('div.dashboard', [
        h('span.health', pubs.health)
      ])
    },
  },
}

const GameApp = {
  children: [Dashboard, Game],
  effects: {
    _react: ({dispatch, state, pubs}) => {
      return h('div.app', [
        h(Dashboard, {dispatch, state, pubs}),
        h(Game, {dispatch, state, pubs}),
      ])
    },
  },
}

// Nest doesn't do anything with publications so you can choose to nest
// publications as well to completely isolate two components.

const GameApp1 = isolate('game1', GameApp)

const GameApp2 = R.pipe(
  nestAction('game2'),
  nestState(R.lensProp('game2')),
  nestPubs('game2'),
)(GameApp)

const TwoGameApps = {
  children: [GameApp1, GameApp2],
  effects: {
    _react: ({dispatch, state, pubs}) => {
      return h('div.two-game-apps', [
        h(GameApp1, {dispatch, state, pubs}),
        h(GameApp2, {dispatch, state, pubs}),
      ])
    },
  },
}

// When or why might you want to override _publish or _subscribe? Can you do
// that knowing you're not going to be breaking anything that depends on those
// pubs?

// TODO:
// - create some tests
//   - dispatch
//     - dispatch(key)
//     - dispatch(object)
//     - dispatch(_, payload)
//     - dispatch(_, trasform)
//     - partially applied equality
// - TODO keep going here. all the features, cases, laziness, etc.
