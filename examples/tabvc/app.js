
import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'

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
const pages = colors.map(page)

const vc = tabvc([
  tabber(pages),
  tabbar(colors)
])

export default vc
