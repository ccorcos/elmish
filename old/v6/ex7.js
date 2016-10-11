// lets brainstorm all over again
// lets meet up with Evan sometime and run through this stuff. Seems like this
// should all be done with Elm.

// TODO:
// - no need for services/creators. should just be able to crawl the static type tree
// -
// - schema with lenses.
// - Z.curry and curried actions and f() is considered f(undefined) so it eats up an arg.
// - declare multiple effects at once so we dont have to call graphql twice.
// - can we use type signatures to specify dependencies, to optimize laziness.

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

// TYPES:
// Init :: State
// Update :: Action -> State -> State'
// Publish :: Dispatch -> State -> Props -> Publication
// Declare :: Dispatch -> State -> Publication -> Props -> LazyTree
// Dispatch :: * -> EFFECT
// Component :: {init: Init, update: Update, publish: Publish, *: Declare}
// create :: * -> Component

// a simple counter component in the raw.
const counter = {
  init: {
    count: 0,
  },
  update: (action, state) => {
    switch (action.type) {
      case 'inc':
        return R.evolve({ count: R.inc }, state)
      case 'dec':
        return  R.evolve({ count: R.dec }, state)
      default:
        throw new TypeError(`Unknown action: ${action.type}`)
    }
  },
  view: (dispatch, state, pub, props) => {
    // Z is a set of helper functions to help us partially apply
    // functions while still being able to compare them for equality.
    // this way we can lazily evaluate child components.
    const action = {
      // inc: () => dispatch({type: 'inc'}),
      inc: Z.partial(dispatch, {type: 'inc'}),
      // dec: () => dispatch({type: 'dec'}),
      dec: Z.partial(dispatch, {type: 'dec'}),
    }
    return h('div.counter' {style: {color: props.color || 'black'}}, [
      h('button.dec', {onClick: action.dec}, '-'),
      h('span.count', {}, state.count),
      h('button.inc', {onClick: action.inc}, '+')
    ])
  },
})

// we have a `create` function to help ease some of this boilerplate. developers
// shouldnt need to to use Z at all. and switching / duck typing on strings is
// a terrible practice in general (except js lol). actions are deduced from the update keys
// props come from parent component, e.g. to configure the color or callback
// hooks like onClick, just like you're used to in React.
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

// using the actions key, we can transform arguments to the action dispatching
// function into a payload. typically, we want actions to remain serializable
// for tracking and recording purposes. otherwise, we could do the transformation
// inside the update function.
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

// components with child components must specify a schema of their children.
// this will set up the child state, wire up children with their states and
// dispatch functions, merge their publications, and lift their effects together.
// We don't want to have to manually merge all effects for every child component
// up to the top-level component. Thus would make components much less resusable
// and add a lot of boilerplate code. Thus, each effectful "service" must specify
// a "lift" function that lifts multiple effects into a single effect, typically
// represented as a Lazy Tree. Thus when we connect a component to a service, it
// can lazily diff the tree to make mutations, just like React. React is no different
// than any other effectful service, and it has a lift function that simply wraps
// components in a div.
const counters = create({
  children: {
    height: counter,
    width: counter,
  },
})

// you may want to override the lift function to customize exactly whats happening.
// you'll pretty much always want to do this for the view function. you'll get an
// extra argument now as well, a Map for the children components which are functions
// that you can pass props to. all the rest is wired up for you!
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

// you can add some local state if you want as well. just make sure
// you don't override any of the child stuff. the child state gets wired
// up just like the schema specifies, and there's a child action type
// for forwarding actions to children.
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
// modal window is elsewhere in the component tree. you can  just publish it
// and a modal elsewhere can subscribe to it. and since publications are just a
// pure function of state, you don't really need to worry about publications
// remaining serializable.
// TODO: The only awkward thing here is you can't change the state and call a
// parent callback at the same time. I'm not sure you'll every have to do this
// in practice, but it seems like something you may want to do.
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

// a modal window can subscribe to the modal publication field and display it
// when it exists. subscriptions work like lenses which limit the publication
// fields. when a component has children, lenses compose/merge together so that
// all children get the proper associated fields from the publication and no more.
// this way we can lazily diff state, props, and publications for each effect before
// recomputing.
const modal = create({
  subscribe: (state, props) => {
    return R.lensProp('modal')
  },
  view: (action, state, pub, props) => {
    return pub.modal ? pub.modal : false
  }
})

// everything should get wired up easily.
const app = create({
  children: {
    modal: modal,
    button: warning,
  }
})

// everything gets a little trickier with dynamic schemas -- when there are a variable
// number of children / child states. you can use lenses to specify how to get and update
// the states of the children. this can also be a function of state!
const listOf = (kind) => {
  return {
    children: (state) => {
      return {
        kind,
        lend: R.compose(R.map(R.lensProp('child')), R.lensProp('list')),
      }
    },
    init: {
      id: 0,
      list: []
    },
    update: {
      insert: (state) => {
        return R.evolve({
          id: R.inc,
          list: R.append({id: state.id, child: kind.init})
        }, state)
      },
      remove: (state, id) => {
        return R.evolve({
          list: R.filter(R.complement(R.propEq('id', id)))
        }, state)
      }
    },
    actions: {
      // remove is going to be a curried function using Z.curry
      // for partially applied funciton equality. we want to bind the function
      // to the id of the child before passing the function on to the child.
      // the child can all this function with nothing to invoke it. thus, the
      // developer never needs to touch Z.partial.
      remove: (id, _) => id,
    }
    view: (children, action, state, pub, props) => {
      return h('div', [
        h('button.insert', { onClick: action.insert }, '+')
        children.map((child, idx) => {
          const id = state.list[idx].id
          return h('div', [
            child.view({ onRemove: action.remove(id) }),
          ])
        })
      ])
    }
  }
}

// this is a basic time-travel component implementing undo and redo.
// TODO: it would be great to support more sophisticated schemas. for performance
// reasons, it would be nice to hold all the states in a single array with a single
// int for time which indexes into that array. for example:
// {
//   init: {
//     time: 0,
//     states: [kind.init]
//   },
//   children: (state) => {
//     return {
//       kind: kind,
//       lens: R.compose(
//         R.lensIndex(state.time),
//         R.lensProp('states'),
//       )
//     }
//   }
// }
// I'm not sure how to deal with naming though -- how do we reference the children in
// the declare functions?
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

// this just demonstrates how making http requests is pretty much no different from
// rendering react to the DOM. we just add another "declare" function called http.
// we also use some helper funtions on the http serivce to create the LazyTree nodes
// for the GET requests. also, notice that the actions return promises that resolve
// action payloads so we can do async processing like pulling out the which is how
// ES6 window.fetch works.
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
    success: (where, response) => {
      return response
      .json()
      .then(R.path(['data', 'weather', where, 'description']))
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
      .success(action.success(where))
      .error(action.error)
    }
  }
})

// just demonstrating here how we could override the http function to manually merge
// http requests. we might want to do this if we want to block certain requests or do
// something fancy. Or we could just lift the children together into a lazy tree which
// is exactly what would have happened had we not even defined the http function. but
// just for the sake of example, if http returned undefined, we'd be blocking all HTTP
// requests from these components.
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

// graphql works the same as anything else, but there a few tricks here. we'll
// treat the graphql query like an http request or any ther side-effect. we can
// use some helper functions to construct the proper types and ensure the proper
// lifting.
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

// we want to lift the children graphql fragments into the user query
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

// this is where things get interesting. we could use Relay or Apollo as a
// service to do deal with caching, etc., or we could use a component to do
// that. but more importantly, if some data is already cached, we shouldnt
// show a loading view at all. we should be able to synchronously fetch that
// data, and that's what we're going to do there.
const graphql = (kind) => {
  return create({
    children: {
      kind: kind,
    },
    init: {
      // if we wanted to cache in this component, it would just be
      // part of the state, and we'd need to do all kinds of fancy
      // stuff, denormalizing data, diffing queries with the cache,
      // and sending http requests.
      cache: {}
    },
    update: {
      // handle http responses, and denormalize data into the cache.
    },
    graphql: (children, action, state, pub, props) => {
      // since we're consuming everything here, we can simply return nothing
      return
    },
    http: (children, action, state, pub, props) => {
      // we can diff the query against the cache to determine which http requests
      // we want to send. and merge that with the children http requests in case
      // they're making requests outside of graphql.
      const query = children.kind.graphql()
      const more = diff(query, state.cache)
      return http.lift(children, more)
    },
    view: (children, action, state, pub, props) => {
      // lookup data from the cache and pass the data as props
      // TODO: we've had to run children.kind.graphql() twice. once in http and
      // again in view. That's not ideal, and very confusing if you were trying
      // to debug whats going on. I'm not sure how to fix this though. maybe we
      // could have special multi-declare function which lets you return an Map
      // of declarative effects. in fact, there's no reason we couldn't declare
      // all side-effects that way...
      const query = children.kind.graphql()
      const data = lookup(query, state.cache)
      return children.kind.view(data)
    }
  })
}

