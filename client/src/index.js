import React from 'react'
import ReactDOM from 'react-dom'
import io from 'socket.io-client'

import { App } from './components/app/App'

// const socket = io()
// window.socket = socket

ReactDOM.render(<App />, document.getElementById('root'))
