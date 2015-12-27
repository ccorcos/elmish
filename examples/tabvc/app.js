
import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'

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

const vc = tabvc(colors.map(page), colors)

export default vc
