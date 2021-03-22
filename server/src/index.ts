import express from 'express'
import path from 'path'

const app = express()
const port = 3000
const publicPath = path.resolve('../client/public')

app.use(express.static(publicPath))

app.listen(port, () => {
	console.log(`Listening to http://localhost:${port}`)
})
