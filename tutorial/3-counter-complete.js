// I want to show you a few more conventions to use, and then we'll be ready
// to tackle some more challenging problems.

// I'm putting the the main logic in elmish
import start from 'src/elmish'
// React is a "service" that handles nasty mutations and side-effects
import render from 'src/service/react'
// Ramda is a great functional toolbelt library, similar to underscore or
// lodash. Curry will "auto-curry" your function. It looks at function.length
// and returns a new function if not all the arguments are there, otherwise
// calls the function. Its good practive to auto-curry all your functions.
// http://ramdajs.com/docs/#curry
import curry from 'ramda/src/curry'
// I talk about hyperscript later
import h from 'react-hyperscript'


const init = () => ({count: 0})

// auto-curry
const update = curry((state, action) => {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1}
    case 'decrement':
      return {count: state.count - 1}
    default:
      console.warn("Unknown action:", action)
      return state
  }
})

// I want to demystify React a little bit. The React DOM tree is just a simple
// JSON tree with some function helpers for building that tree.
// For example, the following JSX:
//
// <div>
//   <button onClick={dec}>-</button>
//   <span>{state}</span>
//   <button onClick={inc}>+</button>
// </div>
//
// is equivalent to the following JSON:
//
// {
//   type: 'div',
//   props: {}
//   children: {
//     0: {
//       type: 'button',
//       props: {
//         onClick: dec
//       },
//       children: '-'
//     }
//     1: {
//       type: 'span',
//       props: {},
//       children: state
//     },
//     2: {
//       type: 'button',
//       props: {
//         onClick: inc
//       },
//       children: '+'
//     }
//   }
// }
//
// I prefer to use hyperscript instead of JSX because or JSON because its
// concise and I don't like HTML. I also like how its compatible with
// virtual-dom and snabbdom which are worthy candidates to React if you aren't
// interested in React Native.
// https://github.com/mlmorg/react-hyperscript
// https://github.com/paldepind/snabbdom
// https://github.com/Matt-Esch/virtual-dom
//
// The following JSX:
//
// <div className="counter">
//   <button className="dec" onClick={dec}>-</button>
//   <span className="count">{state}</span>
//   <button className="inc" onClick={inc}>+</button>
// </div>
//
// is equivalent to the following hyperscript:
//
// h('div.counter', [
//   h('button.dec', {onClick: dec}, '-'),
//   h('span.count', state),
//   h('button.inc', {onClick: inc}, '+')
// ])
//
// I want you to feel comfortable that these are all just the same abstractions
// for building plain old JSON data structures.

// Rendering html is just one kind of side-effect. Other side-effects could be
// HTTP requests, global event listeners, subscriptions, etc. All of these
// side-effects must be specified with a declarative data structure.
// Thus we'll call this  function `declare` to remind us that we're simply
// declaring what we want and letting some other service take care of
// everything else.
// declare : (dispatch, state) -> effects
const declare = curry((dispatch, state) => {
  const inc = () => dispatch({type: 'increment'})
  const dec = () => dispatch({type: 'decrement'})
  return {
    html:
      h('div.counter', [
        h('button.dec', {onClick: dec}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: inc}, '+')
      ])
  }
})

const app = {init, update, declare}

// start takes an app and a list of services and puts it all together.
start(app, [render])
