// contraint solver and more advanced stuff
// https://github.com/iamralpht/slalom

// then think about how to use slalom and contraint solvers for specifying 
// animations. Also think about how to use constraint solvers for specifying
// inline css.  

import start from 'elmish'
import render from 'elmish/services/react'
import hotkeys from 'elmish/services/hotkeys'
import raf from 'elmish/services/raf'

import debug from 'elmish/ui/debug'
import listOf from 'elmish/ui/listOf'
import slider from 'elmish/examples/animation/slider'

start(debug(listOf(slider)), [render, raf, hotkeys])
