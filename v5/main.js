
import R from 'ramda'
import hyperscript from 'react-hyperscript'
import flyd from 'flyd'
import is from 'is-js'

// demo:
// - hotkeys and logger -- no ui at all!

const Elmish = {
  component: (spec) => {
    const effects = {hotkeys, logger}
    Object.keys(effects).forEach(name => {
      spec[name] = effects[name].lazy(spec[name])
    })
  }
}

const toggler = (name, key) => {
  return Elmish.component({
    init: () => true,
    update: (state, action) => !state,
    // side-effect to wire up hotkeys
    hotkeys: (state) => {
      return hotkeys.effect({
        [key]: hotkeys.event(id)
      })
    },
    // side-effect to console.log
    logger: (state) => {
      return logger.effect(`${name} is ${state ? 'on' : 'off'}.`)
    }
  })
}

const heater = toggler('heater', 'h')
const cooler = toggler('cooler', 'c')

const app = Elmish.component({
  init: () => {
    return {
      heater: heater.init(),
      cooler: cooler.init(),
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'heater':
        return evolve({
          heater: s => heater.update(s, action.action)
        }, state)
      case 'cooler':
        return evolve({
          cooler: s => cooler.update(s, action.action)
        }, state)
      default:
        return state
    }
  },
  hotkeys: (state) => {
    return hotkeys.effect({
      heater: heater.hotkeys(state.heater),
      cooler: cooler.hotkeys(state.cooler),
    })
  },
  logger: (state) => {
    return logger.effect('status:', [
      heater.logger(state.heater),
      cooler.logger(state.cooler),
    ])
  })
}













// problems for later:
// - automatically wire up other side-effects through to children

// strategy for now:
// - every side-effect is going to have a driver and effect property
// - the driver needs to be able to parse a lazy tree of effects
// - the effect function is used for constructing the effects
// - an effect is effectively a functor that contains a function for scoping actions
// - events are special types that get parsed and piped into a dispatch function
// - effects may return synchronously!


const Event = Type('Event', ['fn'], {
  equals: (e1, e2) =>
    e1._type === e2._type
    && R.equals(e1.fn, e2.fn),
//   map: (fn, e) => Event(bind(R.map, fn, e.fn))
})

const Node = Type('Node', ['props', 'children', 'fn'], {
  equals: (n1, n2) =>
    n1._type === n2._type
    && R.equals(n1.fn, n2.fn)
    && R.equals(n1.props, n2.props)
    && R.equals(n1.children, n2.children),
  parse: (n) => {
    // find all events in the props, parse all children, and return a function
    // that takes dispatch
  }
})







const hotkeys = {
  setup: () => {
    return {
      keys: [],
      listeners: {},
    }
  },
  update: (state, action) => {
    switch (action.type) {
      case 'keydown':
        return state
      case 'keyup':
        return state
      case 'declare':
        return state
      default:
        return state
    }
  },



  effect: () => {},
  driver: () => {},
  event: () => {},
  lift: () => {},
}

const id = x => x

const app = {
  init: () => true,
  update: (state, action) => !state,
  hotkeys: (state) => {
    return hotkeys.effect({
      'space': hotkeys.event(id)
    })
  },
}

























// problems
// - how to dynamically handle differet


// elmish is going to have side-effect "services" registered to it.
// then when you create components, they will properly configure those services
// and how theyre merged together.

// a side-effect service has an `effect` constructor and the service `driver`
// functions. side-effect services typically deal in lazy trees and diff thunks
// to make efficient updates, just like react. Elm 0.17 has effects has a functor
// that dispatches actions. Its not

const VNode = Type('VNode', ['tag', 'props', 'children'], {
  parse: (x) => (d) => {

  }
})

const VEvent = Type('VEvent', ['fn'])
const Html = Type('Html', (vtree, route=[]) => ({vtree, route}), {
  map: (fn, x) => Html(x.vtree, [fn].concat(x.route)),
  parse: (x) => (dispatch) => {
    // parse the x.vtree for VEvents and connects to dispatch with the proper
    // routing functions in x.route
  }
})

// so we need to be able to call component.map(toChildAction). this component also
// needs to end up being lazy.


PairOfCounters = Elmish.Component({
  init: () => ({
    0: Counter.init(),
    1: Counter.init(),
  }),
  update: route({
    0: Counter.update,
    1: Counter.update,
  }),
  view: (state) =>
    Html.Effect('div.pair-of-counters', {}, [
      Counter.map(forward(0)).view(state[0]),
      Counter.map(forward(1)).view(state[1]),
    ])
  hotkeys: (state) => {

  }
})

// but how do you know that you need to generate a hotkeys function to merge?
// you could do something









// html rendering side-effect service using react
const html = {
  effect: poly([
    [is.string, is.hash, is.array],
    () => {

    },
  ])
}





// the html effect driver
const html = {
  event: (fn) => {
    _type: 'event',
    transform: fn,
  },
  effect: (name, properties, children) => {
    if (!is.hash(props)) {
      children = props
      props = {}
    }
    const dispatch = flyd.stream()
    // pass actions through transform into dispatch stream
    const wiredProps = R.map(prop => {
      if (prop._type === 'event') {
        return bind(forward, prop.transform, dispatch)
      } else {
        return prop
      }
    })

    // forward child effects through dispatch
    if (is.array(children)) {
      children.forEach(child => {
        if (child._type === 'effect' && name === 'html') {
          flyd.on(dispatch, child.dispatch)
        }
      })
    } else if (children._type === 'effect' && children.name === 'html') {
      flyd.on(dispatch, children.dispatch)
    }

    return effect('html', id, {react: hyperscript(name, wiredProps, children), dispatch})
  },
  // probably best to use a stream reducer here
  // not sure how to cleanup dispatch streams either because they seem to maintain reference
  driver: (node) => (action, {transform, properties:{react, dispatch}}) => {
    ReactDOM.render(react, node)
    flyd.on(R.pipe(transform, action), dispatch)
  }
}

























// an effect object which you can map over to alter the action it dispatches
const effect = (name, transform, properties) => {
  const _effect = () => {
    return {
      _type: 'effect',
      name,
      transform,
      properties,
      map: (fn) => {
        return __effect(name, R.map(fn, transform), properties)
      }
    }
  },
  return _effect()
}


// a helper so we can use bind to maintain function equality
const forward = (transform, stream, value) => {
  return stream(transform(value))
}

// the html effect driver
const html = {
  event: (fn) => {
    _type: 'event',
    transform: fn,
  },
  effect: (name, properties, children) => {
    if (!is.hash(props)) {
      children = props
      props = {}
    }
    const dispatch = flyd.stream()
    // pass actions through transform into dispatch stream
    const wiredProps = R.map(prop => {
      if (prop._type === 'event') {
        return bind(forward, prop.transform, dispatch)
      } else {
        return prop
      }
    })

    // forward child effects through dispatch
    if (is.array(children)) {
      children.forEach(child => {
        if (child._type === 'effect' && name === 'html') {
          flyd.on(dispatch, child.dispatch)
        }
      })
    } else if (children._type === 'effect' && children.name === 'html') {
      flyd.on(dispatch, children.dispatch)
    }

    return effect('html', id, {react: hyperscript(name, wiredProps, children), dispatch})
  },
  // probably best to use a stream reducer here
  // not sure how to cleanup dispatch streams either because they seem to maintain reference
  driver: (node) => (action, {transform, properties:{react, dispatch}}) => {
    ReactDOM.render(react, node)
    flyd.on(R.pipe(transform, action), dispatch)
  }
}

const e = html.event
const h = html.effect

const inc = () => +1
const dec = () => -1

const counter = {
  init: () => {
    return {
      state: 0,
      effect: undefined,
    }
  },
  update: (action, state) => {
    return {
      state: state + action
      effect: undefined,
    }
  },
  subscriptions: (state) => {
    return
  },
  view: (state) => {
    return h('div', [
      h('button.dec', {onClick: e(dec)}, '-'),
      h('span', state),
      h('button.inc', {onClick: e(inc)}, '-'),
    ])
  }
}

const drivers = {
  html: html.driver(document.getElementById('root'))
}

const start = ({init, update, subscribe, view}) => {

  const step = (actions, state) => {
    const stateAndEffect = actions.reduce((acc, action) => {
      const {state, effect} = update(action, acc.state)
      return {state, effect: acc.effect.concat([effect])}
    }, {state, effect:[]})

    const effectActions = []
    const dispatch = (a) => effectActions.push(a)

    stateAndEffect.effect.forEach(fx => {
      driver[fx.name](dispatch, fx)
    })

    return {
      actions: effectActions,
      state: stateAndEffect.state
    }
  }
}





















/*






const id = x => x

const effect = (name, dispatch, transform, props) => {
  return {
    _type: 'effect',
    name,
    dispatch,
    transform,
    props,
  }
}




const html = {
  effect: (name, props, children) => {
    if (!is.hash(props)) {
      children = props
      props = {}
    }
    const dispatch = flyd.stream()
    const wiredProps = R.map(prop => {
      if (prop._type === 'event') {
        return bind(forward, prop.transform, dispatch)
      } else {
        return prop
      }
    })

    // forward child actions through dispatch
    if (is.array(children)) {
      children.forEach(child => {
        if (child._type === 'effect' && name === 'html') {
          flyd.on(dispatch, child.dispatch)
        }
      })
    } else if (children._type === 'effect' && children.name === 'html') {
      flyd.on(dispatch, children.dispatch)
    }

    return effect('html', dispatch, id, {react: hyperscript(name, wiredProps, children)})
  },
  driver: ({dispatch, transform, props:{react}} => {

  })
}

// const h.map = (fn, c) => {
//   return R.merge(c, {dispatch: c.dispatch.map(fn)})
// }



const interval = {
  effect: (interval, transform) => {
    const dispatch = flyd.stream()
    return effect('interval', dispatch, transform, {interval})
  },
  // this will actually need to handle and array or something and also be
  // able to cancel intervals when something is missing from the array...
  driver: ({dispatch, transform, props:{interval}}) => {
    setInterval(() => dispatch(transform(Date.now())), interval)
  },
}




const inc = () => +1
const dec = () => -1

const counter = {
  init: () => {
    return {
      state: 0,
      effect: undefined,
    }
  },
  update: (action, state) => {
    return {
      state: state + action
      effect: undefined,
    }
  },
  subscriptions: (state) => {
    return
  },
  view: (state) => {
    return h('div', [
      h('button.dec', {onClick: e(dec)}, '-'),
      h('span', state),
      h('button.inc', {onClick: e(inc)}, '-'),
    ])
  }
}



const clock = {
  init: () => {
    return {
      state: Date.now() % 60,
      effect: undefined,
    }
  },
  update: (action, state) => {
    return {
      state: action % 60
      effect: undefined,
    }
  },
  subscriptions: (state) => {
    return interval.effect(1000, id)
  },
  view: (state) => {
    return h('span.clock', state)
  }
}


















// const LazyReact = React.createClass({
//   shouldComponentUpdate(nextProps, nextState) {
//     return !R.equals(this.props, nextProps) // || !R.equals(this.state, nextState)
//   },
//   render() {
//     return R.apply(this.props.view, this.props.args)
//   }
// })
//
// const viewbind = (view, ...args) => {
//   return hyperscript(LazyReact, {view, args})
// }




something

h('button', {
  onClick: e(increment)
}, [
  mycomponent.map(something)
])

//






const h = (name, props, children) => {
  const dispatch$ = flyd.stream()


  // if props is array or string, props is {}
  return {
    type: 'html',
    output:
  }
}


const Clock = {
  // init : () -> {state, effects}
  init: () => ({
    state: 0,
    effects: [],``
  }),
  update: (action, state) => ({
    state: action,
    effects: [],
  }),
  subscriptions: (state) => [{
    type: 'tick',
    delay: 1000,
    action: id,
    output: flyd.stream(),
  }],
  view: (state) => {
    const angle = (state / 1000 / 60) % (60)
    const x = (50 + 40 * Math.cos(angle))
    const y = (50 + 40 * Math.sin(angle))
    const output = flyd.stream()

  }
}

// svg [ viewBox="0 0 100 100" ]
//       [ circle [ cx "50", cy "50", r "45" ] []
//       , line [ x1 "50", y1 "50", x2 handX, y2 handY ] []
//       ]



*/