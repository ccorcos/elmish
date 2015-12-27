
import start from 'elmish'
import render from 'elmish/services/react'
import hotkeys from 'elmish/services/hotkeys'

import debug from 'elmish/ui/debug'
import app from 'elmish/examples/tabvc/app'

start(debug(app), [render, hotkeys])