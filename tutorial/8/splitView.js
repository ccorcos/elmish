// This is a very simple split-view component. But in a better implementation
// it would maintain a toggleable state, it would be responsive, and might also
// be swipable.

import h from 'react-hyperscript'

import 'elmish/tutorial/8/styles/splitView.styl'

export default ({sidebar, content}) => {
  return (
    h('div.split-view', [
      h('div.sidebar', {}, sidebar),
      h('div.content', {}, content)
    ])
  )
}
