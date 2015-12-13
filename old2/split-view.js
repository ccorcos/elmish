import h from 'react-hyperscript'

import 'styles/split-view'

export default ({sidebar, content}) => {
  return (
    h('div.split-view', [
      h('div.sidebar', {}, sidebar),
      h('div.content', {}, content)
    ])
  )
}
