import start from 'elmish'
import render from 'elmish/src/services/react'
import hotkeys from 'elmish/src/services/hotkeys'
import raf from 'elmish/src/services/raf'

import debug from 'elmish/src/ui/debug'
import slider from 'elmish/tutorial/8-additive-animations/slider'
import listOf from 'elmish/src/ui/listOf'

/*
when you run the example, make sure spam the toggle button
mid-animation to see that its smooth. This demo helps you
understand the contrast a little better:

https://rawgit.com/chenglou/react-tween-state/master/examples/index.html

Also, notice that time-travel works with the animations as well
and you can even recover the animations if you press play mid-animation.
*/

// start(debug(slider), [render, raf, hotkeys])

// its also intersting to analyze the performance by putting 20 sliders
// in a list and toggling them all at the same time with `t`.
start(debug(listOf(slider)), [render, raf, hotkeys])
