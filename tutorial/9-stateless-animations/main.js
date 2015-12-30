import start from 'elmish'
import render from 'elmish/src/services/react'
import hotkeys from 'elmish/src/services/hotkeys'
import raf from 'elmish/src/services/raf'

import debug from 'elmish/src/ui/debug'

import app from 'elmish/tutorial/9-stateless-animations/app'

start(debug(app), [render, raf, hotkeys])
