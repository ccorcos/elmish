// lets brainstorm all over again
// lets meet up with Evan sometime and run through this stuff. Seems like this
// should all be done with Elm.

// - counter
// - counter pair
// - publish / subscribe
// - modal
// - listOf
// - time travel
// - http
// - graphql

// - caching
// - laziness
// - performance


// just a counter. actions are deduced from the update keys
const counter = create({
  init: {
    count: 0,
  },
  update: {
    inc: R.evolve({ count: R.inc }),
    dec: R.evolve({ count: R.dec }),
  },
  view: (action, state, pub, props) => {
    return h('div.counter' {style: {color: props.color || 'black'}}, [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  },
})

// using the actions key, we can transform the action payload.
const username = create({
  init: {
    text: '',
  },
  update: {
    change: (state, payload) => R.assoc('text', payload, state),
  },
  actions: {
    change: (e) => e.target.value,
  },
  view: (action, state, pub, props) => {
    return h('input.username', {
      type:'text',
      placeholder:'username',
      onChange: action.change,
      value: state.text,
    })
  },
})

// components must specify the schema of their children to wire up
// any effects (more on that later). this is also convenient for wiring up
// the child states, actions, etc.
const counters = create({
  children: {
    height: counter,
    width: counter,
  },
})

// you can override the view function if you want to customize how it renders
const counters = create({
  children: {
    height: counter,
    width: counter,
  },
  view: (children, action, state, pub, props) => {
    return h('div.counters', [
      children.height.view({color: 'blue'}),
      children.width.view(),
    ])
  },
})

// you can even add some local state if you want as well. just make sure
// you dont overwrite any child state
const counters = create({
  children: {
    height: counter,
    width: counter,
  },
  init: {
    name: ''
  },
  update: {
    change: (state, payload) => R.assoc('name', payload, state),
  },
  actions: {
    change: (e) => e.target.value,
  },
  view: (children, action, state, pub, props) => {
    return h('div.user', [
      h('input.name', {
        type: 'text',
        placeholder: 'name',
        onChange: action.change,
        value: state.name
      }),
      'height:', children.height.view({color: 'blue'}),
      'weight:', children.width.view(),
    ])
  },
})

// suppose you have a button that you want to open up a modal window. but the
// modal window is elsewhere in the component tree.
// just publish it and a modal elsewhere can pick it up
const warning = create({
  init: {
    opened: false,
  },
  update: {
    toggle: R.evolve({ opened: R.not }),
  },
  publish: (action, state, props) => {
    if (state.opened) {
      return {
        modal: h('div', [
          'Are you sure you want to do this?',
          h('button', { onClick: props.onYes }, 'yes'),
          h('button', { onClick: props.onNo }, 'no'),
        ])
      }
    }
  },
  view: (action, state, pub, props) => {
    return h('button', { onClick: action.toggle }, 'delete')
  }
})

// subscribe uses a lens to limit the publication data passed to this component
// so we can be lazy and performant. it will compose subscriptions from children
// if there were any.
const modal = create({
  subscribe: {
    modal: true
  },
  view: (action, state, pub, props) => {
    return pub.modal ? pub.modal : false
  }
})

const app = create({
  children: {
    modal: modal,
    confirm: warning,
  }
})

// you can create dynamic schemas as well. you just need to make sure the
// component is inside an array and it will be interpretted as such.
const listOf = (kind) => {
  return {
    children: {
      list: [{state: kind}]
    },
    init: {
      id: 0,
      list: []
    },
    update: {
      insert: (state) => {
        return R.evolve({
          id: R.inc,
          list: R.append({id: state.id, state: kind.init})
        }, state)
      },
      remove: (state, id) => {
        return R.evolve({
          list: R.filter(R.complement(R.propEq('id', id)))
        }, state)
      }
    },
    view: (children, action, state, pub, props) => {
      return h('div', [
        h('button.insert', { onClick: action.insert }, '+')
        children.list.map((child, idx) => {
          const id = state.list[idx].id
          return h('div', [
            // make sure you use Z.partial for performance!
            // (1) maybe children remove themselves
            child.state.view({ onRemove: Z.partial(action.remove, id) }),
            // (2) or maybe not...
            // h('button.remove', { onClick: Z.partial(action.remove, id) }, '-')
          ])
        })
      ])
    }
  }
}


const undoable = (kind) => {
  return {
    children: {
      // since we only care about the current state effects
      now: kind
    },
    init: {
      past: [],
      future: [],
    },
    update: {
      undo: (state) => {
        return {
          now: R.last(state.past),
          past: R.init(state.past),
          future: R.concat([state.now], state.future),
        }
      },
      redo: (state) => {
        return {
          now: R.head(state.future),
          past: R.concat(state.past, [state.now]),
          future: R.tail(state.future),
        }
      },
      // hijack the child actions
      child: (state, payload) => {
        const next = kind.update(state.now, payload)
        return {
          now: next,
          future: [],
          past: R.concat(state.past, [state.now]),
        }
      }
    },
    view: (children, action, state, pub, props) => {
      const canUndo = state.past.length > 0
      const canRedo = state.future.length > 0
      return h('div.undoable', [
        h('button.undo', { onClick: action.undo, disabled: !canUndo }, 'undo'),
        h('button.redo', { onClick: action.redo, disabled: !canRedo }, 'redo'),
        children.now.view(),
      ])
    }
  }
}

// suppose you want to fetch data, thats easy too
const weather = create({
  init: {
    error: undefined,
    data: undefined,
  },
  update: {
    success: (state, payload) => {
      return { data: payload }
    },
    error: (state, payload) => {
      return { error: payload }
    },
  },
  actions: {
    success: (response) => {
      return response
      .json()
      .then(R.path(['data', 'weather', 'description']))
    },
    error: (response) => {
      return response.status === 404 : 'Not found' : 'Unknown error'
    }
  },
  view: (action, state, pub, props) => {
    return h('div.weather', [
      state.error ? state.error :
      state.data ? state.data :
      'loading...'
    ])
  },
  http: (action, state, pub, props) => {
    if (!state.data && !state.error) {
      // this looks imperative, but its actually just returning a simple data
      // structure.
      return http.get(`http://weather.com/api/?q=${encodeUri(props.where)}`)
      .success(action.success)
      .error(action.error)
    }
  }
})

const app = create({
  children: {
    sf: weather,
    la: weather,
  },
  view: (children, action, state, pub, props) => {
    return h('div.weathers', [
      children.sf.view({where: 'San Francisco'}),
      children.la.view({where: 'Los Angeles'}),
    ])
  },
  http: (children, action, state, pub, props) => {
    // we can do this manually if we want to do something fancy or fire off
    // additional requests. lift is just a way of merging requests together.
    // this should create a lazy declarative data structure similar to the
    // way react works
    return http.lift(children)
  }
})

// graphql would work this same exact way!

const info = create({
  graphql: (action, state, pub, props) => {
    return graphql.fragment(`
      name,
      phone_number
    `)
  },
  view: (action, state, pub, props) => {
    return h('div.info', [
      props.name,
      props.phone_number
    ])
  }
})

const user = create({
  children: {
    info: info
  },
  graphql: (children, action, state, pub, props) => {
    // lift will place the fragments into the user
    return graphql.lift(`
      user(id:${props.id}) {
        id,
      }
    `, children)
  },
  view: (children, action, state, pub, props) => {
    return h('div.user', [
      props.user ? children.info.view(props.user) : 'loading...'
    ])
  }
})

// we can user a HOC to wrap components, bundle up the graphql requests,
// and pass them back down as props
const graphql = (kind) => {
  return create({
    children: {
      kind: kind,
    },
    init: {
      cache: {}
    },
    update: {
      // all kind of fancy denormalization and caching here :)
    }
    http: (children, action, state, pub, props) => {
      // see what data we're still waiting on and fetch it
      const query = children.kind.graphql()
      const more = diff(query, state.cache)
      return http.lift(children, more)
    },
    view: (children, action, state, pub, props) => {
      const query = children.kind.graphql()
      const data = lookup(query, state.cache)
      return children.kind.view(data)
    }
  })
}

// another option would be to use Relay as a service and simply send it off to
// relay and pass it back down as props. That would probably be easier.
