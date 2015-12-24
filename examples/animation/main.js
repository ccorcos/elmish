// for animation
// https://github.com/chrisdickinson/raf
// https://github.com/chenglou/tween-functions
// contraint solver and more advanced stuff
// https://github.com/iamralpht/slalom

// lets make a simple addative animation example along with
// a comparison just like this example:
// https://rawgit.com/chenglou/react-tween-state/master/examples/index.html

// then think about how to use slalom and contraint solvers for specifying 
// animations. Also think about how to use constraint solvers for specifying
// inline css.

import start from 'elmish'
import render from 'elmish/services/react'
import hotkeys from 'elmish/services/hotkeys'
import raf from 'elmish/services/raf'

import debug from 'elmish/ui/debug'
import app from 'elmish/examples/animation/slider'

start(debug(app), [render, raf, hotkeys])
