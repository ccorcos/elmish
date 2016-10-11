
import start from 'elmish'
import render from 'elmish/services/react'
import fetch from 'elmish/services/fetch'
import hotkeys from 'elmish/services/hotkeys'
import debug from 'elmish/ui/debug'

import app from 'elmish/examples/hackernews/topStories'

start(debug(app), [render, fetch, hotkeys])
