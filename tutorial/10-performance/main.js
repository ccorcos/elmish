/*
Goals:
- remember bound functions for referential equality. For example:

        onClick: () => dispatch({type: 'remove', id: item.id})

    This is hard because we need some place to remember these functions
    and dispose of them when we're no longer using them. I've invented
    a concept of a `context` for this. There is a problem that the context
    is being mutated again and again imperatively. Is there some way of
    declaratively specifying the bound function requirements?

- lazily compute. React uses `React.createElement(Component, props)` rather
  than actually calling a component function. This means that the reconciler
  can determine whether it needs to call the function or not. It would be
  amazing if we could do this somehow, but its gets complicated. It would be
  painful to have to repeat the tree structures for every effect -- mapping
  over the list of items getting their html effects, http effects, etc and
  manually joining them when whatever ways.

Ideas:
- What we have here are parallel trees. A render tree, an http request tree,
  a graphql tree, etc. for all side-effects. If we keep the tree structure
  rather than concatenate them immediately, then we can use refEq for performance
  gains, just like react does.

*/



// this is effectively React.createElement
const children = (dispatch, state) => {
  return map(s => [kind.declare, dispatch, item.id, item.state], state.list)
}

// create any bound functions we want to referentially remember
const context = (dispatch, state) => {
  forward = (item) => {
    return {
      [item.id]: (action) => dispatch({type:'child', id: item.id, action})
    }
  }

  pipe(
    map(forward)
    reduce(merge, {})
  )(state.list)



  return {
    insert: () => dispatch({type: 'insert'})

  }
}

const effects = {
  html: (dispatch, state) => {
    h('div.list-of', [
        h('button.insert', {
          onClick: () => dispatch({type: 'insert'})
        }, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              // use React.createElement!
              kind.effects.html(childDispatch(item.id) item.state),
              h('button.remove', {
                onClick: () => dispatch({type: 'remove', id: item.id})
              }, 'x')
            ])
          )
        })
      ])
  }
}



const declare = curry((dispatch, state) => {
  const childDispatch = id => action => dispatch({type: 'child_action', action, id})
  const getChildEffects = (item) => kind.declare(childDispatch(item.id), item.state)
  const childEffects = map(getChildEffects, state.list)
  const childEffectsWithoutHtml = map(omit(['html']), childEffects)
  const nonHtmlEffects = concatAllEffects(childEffectsWithoutHtml)

  return merge(nonHtmlEffects, {
    html:
      h('div.list-of', [
        h('button.insert', {
          onClick: () => dispatch({type: 'insert'})
        }, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              childEffects[i].html,
              h('button.remove', {
                onClick: () => dispatch({type: 'remove', id: item.id})
              }, 'x')
            ])
          )
        })
      ])
  })
})

































// --- OLDER



// this is a side-effect! we dont like this. what should we do?we need to bind funcitons
// and save them somewhere within the computation/heirarchy...

// I could LRU memoize everything since its pure, but I could also inject perfectly efficient
// memoization if I employ a good strategy.

// context is like a state. thats all. we just have to scan with it.

context = {}


context.child(id)
context.bind(dispatch, {type:'increment'})
context.call(declare, dispatch, state, context)


const Keeper = initial => ({
  prev: initial,
  next: {}
})

const Context = () => []

const Context.insert = (keys, value, ctx) => {
  return append({keys, value}, ctx)
}

const refEq = (x, y) => x === y
const Context.lookup = (keys, ctx) => {
  // this can be much more efficient if evaluated lazily!
  const matches = pipe(
    prop('keys'),
    zip(keys),
    map(apply(refEq)),
    allPass
  )

  return pipe(
    findWhere(matches),
    prop('value')
  )(ctx)
}

const Constext.insert = append

Context.bind = (fn, args, ctx) => {
  const res = Context.lookup([fn, ...args)
  return res ? res :
}






const toChild = curry((dispatch, id, action) => dispatch({type: 'child', action, id}))
const toRemove = curry((dispatch, id) => dispatch({type: 'remove', id}))

const declare = curry((dispatch, state, props, context) => {
  let ctx = Keeper(context)
  // how to we avoid this kind of imperative programming, redefining over ctx each time?
  [ctx, insert] = Keeper.bind(dispatch, [{type: 'insert'}], ctx)

  const getChildEffects = (item) =>
    [ctx, childDispatch] = Context.call(toChild, [dispatch, item.id], ctx)
    [ctx, childContext] = Context.child(item.state, ctx)
    [ctx, childEffects] = Context.call(kind.declare, childDispatch, item.state, childContext, ctx)
    [ctx, childRemove] = Context.bind(toRemove, [dispatch, item.id], ctx)
    return assoc('remove',
      childRemove,
      childEffects
    )

  const childEffects = map(getChildEffects, state.list)
  const childEffectsWithoutHtml = map(omit(['html']), childEffects)
  const nonHtmlEffects = concatAllEffects(childEffectsWithoutHtml)

  return merge(nonHtmlEffects, {
    html:
      h('div.list-of', [
        h('button.insert', { onClick: insert }, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              childEffects[i].html,
              h('button.remove', { onClick: childEffects[i].remove })
              }, 'x')
            ])
          )
        })
      ])
    })
})

// everything looks nice and memoized now, but at the cost of a major pain in the ass...
// how can we clean this up?

// make it a stream and use scan?

const declare = curry((dispatch, state, props, context) => {
  let ctx = Keeper(context)
  // how to we avoid this kind of imperative programming, redefining over ctx each time?
  [ctx, insert] = Keeper.bind(dispatch, [{type: 'insert'}], ctx)

  const getChildEffects = (item) =>
    childDispatch = ctx.call(toChild, [dispatch, item.id])
    childContext = ctx.child(item.state)
    childEffects = ctx.call(kind.declare, [childDispatch, item.state, childContext])
    childRemove = ctx.bind(toRemove, [dispatch, item.id])
    return {
      effects: childEffects,
      remove: childRemove
    }

  // XXX
  const childEffects = map(getChildEffects, state.list)
  const childEffectsWithoutHtml = map(omit(['html']), childEffects)
  const nonHtmlEffects = concatAllEffects(childEffectsWithoutHtml)

  return merge(nonHtmlEffects, {
    html:
      h('div.list-of', [
        h('button.insert', { onClick: insert }, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              childEffects[i].html,
              h('button.remove', { onClick: childEffects[i].remove })
              }, 'x')
            ])
          )
        })
      ])
    })
})

/*
this looks like it should work. its a lot of effort though. im not sure
how efficient lookup will be though. O(n a), n: number of items, a: number of arguments.
thats not so good. 50 items willhave  4*50*3 = 600. Thats a lot of overhead. And its probably
not the performance bottleneck of the application...

How does react do it? Aren't we duplicating functionality here? Can't we piggyback on React's
props/state diffing strategy?

The main difference is that React uses React.createElement(Elm, props) as opposed to the
function Elm(props). Calling the functions is done at the time of the diff! To get better
performance, there needs to be some way we can specify the structure of how we call functions
declaratively just like react.

React decides when to compute the next step... I just implemented an imperative version of that
with Context.




*/


// What if performace optimization was an effects transformation?

// lets also suppose we join rahter than concat effects together so performance extends
// other services...
const declare = curry((dispatch, state, props) => {
  let ctx = Keeper(context)
  // how to we avoid this kind of imperative programming, redefining over ctx each time?
  [ctx, insert] = Keeper.bind(dispatch, [{type: 'insert'}], ctx)

  const getChildEffects = (item) =>
    childDispatch = ctx.call(toChild, [dispatch, item.id])
    childContext = ctx.child(item.state)
    childEffects = ctx.call(kind.declare, [childDispatch, item.state, childContext])
    childRemove = ctx.bind(toRemove, [dispatch, item.id])
    return {
      effects: childEffects,
      remove: childRemove
    }

  // XXX
  const childEffects = map(getChildEffects, state.list)
  const childEffectsWithoutHtml = map(omit(['html']), childEffects)
  const nonHtmlEffects = concatAllEffects(childEffectsWithoutHtml)

  return merge(nonHtmlEffects, {
    optimize: {
      html:
        h('div.list-of', [
          h('button.insert', { onClick: insert }, '+'),
          state.list.map((item, i) => {
            return (
              h('div.item', {key:item.id}, [
                childEffects[i].html,
                h('button.remove', { onClick: childEffects[i].remove })
                }, 'x')
              ])
            )
          })
        ])
      })
    }
  }
}


// Moral of the story so far. Optimizing functional code for performance is 100% possible.
// Its pretty difficult for figure out right now though. You cna just tell that this should
// all be made realyl easy somehow. Referential lookup shouldnt be hard. we could hash the
// the pointer addresses or something in C. But creating a lazy stucture... Then it gets parsed
// my the optimizer, then every other service as well. Thats too much.





// ---

const declare = curry((dispatch, state) => {
  const childDispatch = id => action => dispatch({type: 'child_action', action, id})
  const getChildEffects = (item) => kind.declare(childDispatch(item.id), item.state)
  const childEffects = map(getChildEffects, state.list)
  const childEffectsWithoutHtml = map(omit(['html']), childEffects)
  const nonHtmlEffects = concatAllEffects(childEffectsWithoutHtml)

  return merge(nonHtmlEffects, {
    html:
      h('div.list-of', [
        h('button.insert', {
          onClick: () => dispatch({type: 'insert'})
        }, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              childEffects[i].html,
              h('button.remove', {
                onClick: () => dispatch({type: 'remove', id: item.id})
              }, 'x')
            ])
          )
        })
      ])
  })
})


const listOf = component({
  init: () => {},
  update: () => {},
  declare: (dispatch, state) => {

  }
}, [])


component = (children) => {
  declare = (dispatch, state, props) => {
    return {
      html: () => {
        h(),
      }
    }
  }
}

