import flyd from 'flyd'
import h from 'react-hyperscript'
import ReactDOM from 'react-dom'

// drivers represent the stateful, effectful outside world (SEOW).
// they connect to a stream of declarative data-structures (DDS) from our
// pure, functional, state-machine (PFSS).
// these DDS typically have callback functions in then to asynchronous respond
// to the PFSS.

// each driver expects some kind of DDS, and has some pattern from merging them
// together. React components have children, which are actually lazy data
// structures.

// ***since we don't know beforehand what kinds of side-effects other components
// might use, we need to provide a lifting function to generically merge all
// effects from each sub-component.

export const react = (node, tag='span') => {
  return {
    // connect :: Stream DDS -> !
    connect: ($) => {
      // map over a stream of react components and render to the dom
      const render = html => ReactDOM.render(html, node)
      flyd.on(render, $)
    },
    // lift :: {String: Function} -> DDS
    lift: (subfx) => {
      // spans tend to be harmless most of the time
      return h(tag, [
        Object.keys(subfx).map(name => {
          return h(`${tag}.${name}`, {key:name}, subfx[name])
        })
      ])
    },
  }
}
