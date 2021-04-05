import { Request, Response } from 'express'
import { Socket } from 'socket.io'

import config from './config'
import { Application, EndpointPath, Module } from './core/'

// Note: This is just an example for testing
class MyModule extends Module {
	constructor(app: Application) {
		super(app, 'MyModule')

		this.addEndpoints([
			// HTTP endpoint
			{ type: 'HTTP', path: '/test', method: 'GET', handle: this.testHandler.bind(this) },
			// Socket endpoint
			{ type: 'Socket', path: '/getUsername', handle: this.getUsernameHandler.bind(this) }
		])

		this.registerTask('*/10 * * * * *', this.taskActionMethod.bind(this))
	}

	/**
	 * /getUsername socket handler
	 */
	public getUsernameHandler(path: EndpointPath, data: any[], socket: Socket): any {
		return socket.emit('response', {
			path,
			username: 'test'
		})
	}

	/**
	 * /test HTTP handler
	 */
	public testHandler(req: Request, res: Response) {
		this._log(`Handling request ${req.url} from ${req.ip}`)
		return res.json({ message: 'Hello world, this is just a test HTTP endpoint' })
	}

	/**
	 * Task action
	 */
	public async taskActionMethod(): Promise<any> {
		console.log(`Task triggered (every 10s)`)

		return Promise.resolve()
	}

	/**
	 * Log when a socket joins and gets spread
	 */
	public onSocketJoin(socket: Socket): void {
		this._log(`Socket ${socket.id} connected (caught from ${this.name})`)
	}
}

// ---- App ------------------------------------------------------------------------------
const app = new Application({ ...config.app, ...{ db: config.db } })

// Register modules
app.registerModule(MyModule)

// Run the server
app.run()
