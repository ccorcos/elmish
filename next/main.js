import start from 'next/elmish'
import fetch from 'next/fetcher'
import ReactDOM from 'react-dom'
import app from 'next/giphy'
import debug from 'next/debug'
import flyd from 'flyd'

const render = (html) =>
  ReactDOM.render(html, document.getElementById('root'))

const {effect$} = start(debug(app))

flyd.map(({html, http}) => {
  render(html)
  fetch(http)
}, effect$)
