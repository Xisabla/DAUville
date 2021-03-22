import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap'

const body = document.querySelector('body')

const title = document.createElement('h1')
title.textContent = 'Hello World'

body.append(title)

console.log('App running')
