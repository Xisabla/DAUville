import React from 'react'
import ReactDOM from 'react-dom'
import io from 'socket.io-client'

import { App } from './Components/App/App'

const socket = io()

if (process.env.NODE_ENV === 'development') window.socket = socket

ReactDOM.render(<App />, document.getElementById('root'))
