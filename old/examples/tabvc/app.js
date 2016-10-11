import curry   from 'ramda/src/curry'
import map   from 'ramda/src/map'
import merge   from 'ramda/src/merge'

import h       from 'react-hyperscript'

import tabber from 'elmish/examples/tabvc/tabber'
import pager from 'elmish/examples/tabvc/pager'
import tabbar from 'elmish/examples/tabvc/tabbar'
import tabvc   from 'elmish/examples/tabvc/tabvc'

const page = (color) => {

  const init = () => {
    return {}
  }

  const update = curry((state, action) => {
    return state
  })

  const style = {
    backgroundColor: color,
    flex: '1',
  }

  const declare = curry((dispatch, state) => {
    return {
      html: h(`div.${color}`, {style})
    }
  })

  return {init, declare, update}
}


const colors = ['red', 'green', 'blue', 'black']
const pages = map(page, colors)

const vc = tabvc([
  pager(pages),
  tabbar(colors)
])

export default vc
