// lets look at cycle.js for some inspiration

const update = (action$) => {
  return scan(add, 0, action$)
}

const view = ({inc, dec}) => (state) => {
  return h('div', [
    h('button', {onClick: dec}, '-'),
    h('span', state),
    h('button', {onClick: inc}, '+')
  ])
}

const declare = (dispatch$, state$) => {
  const inc = () => dispatch$(+1)
  const dec = () => dispatch$(-1)
  return {
    html$: map(view({inc, dec}), state$)
  }
}

const start = ({update, declare}) => {
  const action$ = stream()
  const state$ = update(action$)
  const effect$ = declare(action$, state$)
  return effect$
}

// the benefits of this so far is that inc and dec are created just once
// and maintain the same reference.


// TODO
// - abstraction (listOf, undoable)
// - lazy evaluation (esp. React)

// Theres no reason we need to do all this piping through state and actions.
// The streams should just connect to each other and work. listOf will help
// understand this. So the following is pretty much wrong:

const filterRoute = curry((id, action$) => {
  return filter(propEq('route', id), action$)
})

const pipeRoute = curry((id, action$) => {
  return pipe(assoc('action', __, {route: id}), action$)
})

const twoCounters = {
  update: (action$) => {
    together = (a, b) => {0: a, 1: b}
    return lift(
      together,
      counter.update(filterRoute(0, action$)),
      counter.update(filterRoute(1, action$))
    )
  },
  declare: (dispatch$, state$) => {

    const effects = [
      counter.declare(pipeRoute(0, dispatch$), filter(prop('0'), state$)),
      counter.declare(pipeRoute(1, dispatch$), filter(prop('1'), state$))
    ]

    const view = (state) => {
      // XXX oy this isnt good here
      return h('div', [
        effects[0].html$,
        effects[1].html$
      ])
    }

    return {
      html$: map(view, state$)
    }
  }
}

// better twocounters
// child declarations should happen only once on the outside of any mapping.

const twoCounters = {
  update: (action$) => {
    const state0$ = pipe(
      filter(propEq('counter', 0)),
      map(prop('action')),
      counter.update
    )(action$)

    const state1$ = pipe(
      filter(propEq('counter', 1)),
      map(prop('action')),
      counter.update
    )(action$)

    const combineState = (a, b) => {counters: [a, b]}

    return lift(combineState, state0$, state1$)
  },
  declare: (dispatch$, state$) => {
    const effects0 = counter.declare(
      pipe(assoc('action', __, {counter: 0}), dispatch$),
      map(pipe(prop('counters'), nth(0)), state$)
    )

    const effects1 = counter.declare(
      pipe(assoc('action', __, {counter: 1}), dispatch$),
      map(pipe(prop('counters'), nth(1)), state$)
    )

    combineHtml = (a, b) => h('div', [a, b])

    return {
      html$: lift(combineHtml, effects0.html$, effects1.html$)
    }
  }
}


// So thats interesting. Its a bit cleaner. A majority of the code is just
// squeezing states and actions together and then separating them apart again.

// pros:
// - if we use referential equality to dedupe the states of each counter as we
//   map to each sub-state, then we wont unnecessarily recompute the declare
//   function for counters that havent changed. but it seems like we should be
//   able to get that benefit without deduping -- we should be able to get the
//   already deduped stream by simply never lifting the states togethre to begin
//   with.
//
// cons:
// - theres a ton of boilerplate / plumbing here.
// - we're not lazily evaluating declare -- we're just deduping. This means that
//   services still need to deal with the entire data structure rather than lazily
//   evaluating the data structure.
// - its hard to imagine using this pattern for a dynamically allocated listOf. We'd
//   need to deal with a stream of streams to do that and likely some other madness
//   as well



// clojure does something similar. they use static methods for graphql fragments.
// and build queries in a similar way. they also use query params and have a similar
// thing going to relay in that regard. using macros, I believe, they're able to
// determine what components need what updates for performance.



// so what if we took a whole new fresh look at this. we want laziness. so why don't
// we just pass the streams themselves! they're lazy right? Then we'll let the service
// deal with observing those streams. we'll also create some helper functions to hide
// all the mess when it comes time.

// so the thinking here is that we have a top-level state stream that has some
// datastructure that with streams inside of it. and if you evaluate the streams
// all the way down, you end up with the current state, but the states are lazy
// and isolated which gives us performance gains. pretty neat. its like a lazy
// cursor. no need to recompute the cursor if we dont care, right?


// just some more random thinking:
// the issue here is that we have to parse through this entire data structure on every
// tick. this can become quite expensive in a gigantic app because theres no encapsulation.
// we want to have the single atom state, but we want encapculation. this is a hard nut to
// crack and the answer is laziness. we shouldnt be recomputing the entire atom every time
// if we dont have to. if only one part of the state changes, we should only have to recompute
// what has changed. The React way of dealing with laziness is with React.createElement which
// lets the reconciler diff props, etc. But this isn't quite as good as it gets. If those
// elements were streams and we could simply map over them to proactively get updates to
// only that point in the tree, then I think thats how we ought to do it.

const counter = {
  // update takes in an action stream, initialized a state stream,
  // and wires up that state stream to get updated with actions.
  update: (action$) => {
    const state$ = stream(0)
    return scan(add, state$, action$)
  },
  // the declare funciton takes a dispatch stream and a state stream
  // and it creates an object of streams that get wired to side-effect
  // services. the one thing thats weird about this is how the dispatch$
  // is meant to be a dump for sideffects
  declare: (dispatch$, state$) => {
    const view = ({inc, dec}) => (state) => {
      return h('div', [
        h('button', {onClick: dec}, '-'),
        h('span', state),
        h('button', {onClick: inc}, '+')
      ])
    }
    const declare = (dispatch$, state$) => {
      const inc = () => dispatch$(+1)
      const dec = () => dispatch$(-1)
      return {
        html$: map(view({inc, dec}), state$)
      }
    }
  }
}


// So Cycle.js is looking more and more interesting each time I look at it.
// I've been growing closer and closer with elmish. One of the big differences
// is the way that services seems to work -- in elmish, you bind the callbacks
// directly to the datastructure whereas in Cycle.js you request those callbacks
// on the other side... kinda weird to me.
//
// - more effort goes into the services for selecting sources and then dealing with
//   isolating everything -- why not just bind callbacks explicitly. Then in elm,
//   you'd deal with isoluation by mapping and filtering over the actions and states.




const pairOf = (kind) => ({
  update: (action$) => {
    const reducer = (state, action) => {
      // the state and the action are just pairs of streams!
      // hopefully that doesnt bite me in the ass later
      return [
        kind.update(state[0], action[0]),
        kind.update(state[1], action[1])
      ]
    }

    return scan(reducer, state$, action$)
  }
})



// just read about Cycle.js and "isoluation" so lets try to think more along those lines
// but the main difference here is we're going to try to use bound callbacks.

const counter = (props$) => {
  const action$ = stream()
  const state$ = scan(add, stream(0), action$)
  const inc = () => action$(+1)
  const dec = () => action$(-1)
  const view = (props, state) => {
    return h('div', [
      h('button', {onClick: dec}, '-'),
      h('span', state),
      h('button', {onClick: inc}, '+')
    ])
  }
  return {
    html$: list(view, props$, state$),
    count$: state$
  }
}

// So this is interesting. encapulation happens all within the component.
// the only thing I don't like about this is that we dont have a single atom
// state anymore so we dont have good insight into the program. we dont get
// time-travel or any of that.
// Comparison
// - elmish
//   + more performant
//   + less boilerplate
//   + encapsulation
//   - no time travel
// - cycle
//   + less boilerplate
//   + works with react
//   + simpler drivers
//   + encapsulation

// i like where this is going here. that counter is the fundamental building
// block. components are functions with streams. the perks of streams is that
// we can scan over them to create state. I like this a lot. we can wrap the
// html$ into a react component even to make react happy so it can lazily
// evaluate within its own ecosystem. pretty neat. maybe one day it will support
// streams!

// ok, now lets build a listOf component

const listOf = (kind) => (props$) => {
  const action$ = stream()
  const init = {id: 0, sinks:[]}
  const update = (state, action) => {
    switch (action.type) {
      case 'insert':
        return evolve({
          nextId: inc,
          sinks: append({id:state.nextId, sink:kind()})
        }, state)
      case: 'remove':
        return evolve({
          state: filter(propNeq('id', action.id))
        }, state)
      default:
        return state
    }
  }
  const state$ = scan(update, init, action$)
  const insert = () => action$({type:'insert'})
  // we could create a stream hear to map over state and make sure to maintain
  // proper references to remove functions. it would be a pain, but i think there's
  // probably no other way. luckily, we probably only ever have to do this once.
  const remove = (id) => () => action$({type:'remove', id})
  const viewItem = (sink, i) => {
    return h('div', [
      sink.html$, // wrap this in a react component
      h('button', {onClick: remove}, '-')
    ])
  }
  const view = (props, state) => {
    return h('div', props, [
      h('button', {onClick: insert}, '+'),
      map(viewItem, state.sinks)
    ])
  }
  return {
    html$: list(view, props$, state$),
    count$: state$
  }
}

// so this is basically it. we could create a react component to handle the whole
// function binding stuff to be optimially efficient. but lets leacethat for later.
// in concept everything is right here. pretty much the only reason I dont like this
// method is we dont get time-travel. perhaps we ought to think about breaking up
// this one function into larger pieces. that way, we'd have more fine-grained control
// over the state and hopefully time tracel. one thing to keep in mind as well is how
// to communicate information to the parent. I like how to can pass the count stream
// to the parent by returning it -- I think thats a healthy way of doing it. input,
// to output. there are no callback functions as prop. props are commands and we return
// responses. in the context of a tabvc: we can filter the props stream for which page
// to be on, and we can merge that with any streams returned by the views trying to
// control the page. boom. easy. this also makes me think, we might find ourselves
// filtering props and then deduping. but maybe it would be better if each prop was
// its own stream and we lift them together manually. then we wouldnt have to dedupe.
// sounds good to me!
//
// - break up into mutliple functions so we can control state
// - create helper functions to put it all together
// - props as individual streams with those helper functions as well


const component = (spec) => (prop$s) => {
  const action$ = stream()
  const state$ = scan(spec.update, spec.init(), action$)
  const effect$s = spec.declare(prop$s, state$, action$)
  return effect$s
}

// REPEAT from earlier
const counter = (props$) => {
  const action$ = stream()
  const state$ = scan(add, stream(0), action$)
  const inc = () => action$(+1)
  const dec = () => action$(-1)
  const view = (props, state) => {
    return h('div', [
      h('button', {onClick: dec}, '-'),
      h('span', state),
      h('button', {onClick: inc}, '+')
    ])
  }
  return {
    html$: lift(view, props$, state$),
    count$: state$
  }
}


const something = (prop$s, ) => {

  return {
    html$: stream(),
    request$s: {
      user: stream()
    }
  }
}


// what is we went in the direction of Om next and treated the entire
// application state like Datascript. We just map and filter and compose
// our queries into that state. Whoa. This is a cool idea! Fuck trees!
// And honestly, we dont really even need graphs either. Just filtering
// streams and composing functions!



















