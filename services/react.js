import flyd     from 'flyd'
import prop     from 'ramda/src/prop'
import raf      from 'raf'
import ReactDOM from 'react-dom'

// old version:
const render = (html) => ReactDOM.render(html, document.getElementById('root'))
const renderer = (effect$) => flyd.on(render, flyd.map(prop('html'), effect$))

// const reactRender = (html) => ReactDOM.render(html, document.getElementById('root'))

// const renderer = (effect$) => {
//   const html$ = flyd.map(prop('html'), effect$)
//   // Everytime we want to render, request an animation frame before
//   // rendering. This will batch up renders and only render the latest
//   // frame.
//   let wait = false
//   const rafRender = () => {
//     if (!wait) {
//       wait = true
//       raf(() => {
//         // always render the latest
//         reactRender(html$())
//         wait = false
//       })
//     }
//   }
//   flyd.on(rafRender, html$)
// }

export default renderer

