
import start from 'elmish'
import render from 'elmish/src/services/react'
import hotkeys from 'elmish/src/services/hotkeys'
import raf from 'elmish/src/services/raf'
import debug from 'elmish/src/ui/debug'

import app from 'elmish/examples/tabvc/app'

start(debug(app), [render, hotkeys, raf])
