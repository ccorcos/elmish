/*

We need to make two apps.

1) a basic router that implements a typical browser history
2) a more complicated tab-nav app using native forward and back buttons

*/

import start from 'elmish'
import render from 'elmish/services/react'
import hotkeys from 'elmish/services/hotkeys'
import router from 'elmish/services/router'

import debug from 'elmish/ui/debug'
import history from 'elmish/ui/history'
import app from 'elmish/examples/routing/app'

start(debug(history(app)), [render, router, hotkeys])
