// import all the drivers you want to use to create the component function

import elmish from 'elmish'
import render from 'elmish-react'
import hotkeys from 'elmish-hotkeys'

export default elmish([
  render,
  hotkeys,
])

// import component from './configure'
//
// component({
//   blah blah blah
// })