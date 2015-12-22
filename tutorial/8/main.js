
import start from 'elmish'
import render from 'elmish/services/react'
import fetch from 'elmish/services/fetch'
import hotkeys from 'elmish/services/hotkeys'
import debug from 'elmish/ui/debug'

import app from 'elmish/tutorial/8/app'

start(debug(app), [render, fetch, hotkeys])
