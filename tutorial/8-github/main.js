
import start from 'src/elmish'
import render from 'src/service/react'
import fetch from 'src/service/fetch'
import hotkeys from 'src/service/hotkeys'
import debug from 'src/ui/debug'

import app from 'tutorial/8-github/app'

start(debug(app), [render, fetch, hotkeys])
