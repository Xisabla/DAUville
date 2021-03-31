import { Socket } from 'socket.io'

import { Application } from './core/Application'
import { EndpointPath } from './core/Endpoint'
import { Module } from './core/Module'

const app = new Application({ public: '../client/public' })

// Note: This is just an example for testing
class MyModule extends Module {
	constructor(app: Application) {
		super(app, 'MyModule')

		/*
		// HTTP endpoints
		// fetch()/GET/POST/... --> express --> response
		this.addEndpoint("/route/to/endpoint", endpoint)

		// Socket endpoints
		// event --> socket route --> ... > exchanges <... --> final response
		this.addEndpoint("/route/to/endpoint", endpoint)

		// Socket emit
		// task --> (check right/need ??) --> socket --> on --> ... > exchanges < ... --> final response
		this.registerTask
		*/

		this.addEndpoint({ type: 'Socket', path: '/getUsername', handle: this.getUsernameHandler.bind(this) })
	}

	public getUsernameHandler(path: EndpointPath, data: any[], socket: Socket): any {
		return socket.emit('response', {
			path,
			username: 'test'
		})
	}

	public onSocketJoin(socket: Socket): void {
		this._log(`Socket ${socket.id} connected (caught from ${this.name})`)
	}
}

// ---- Register modules -----------------------------------------------------------------
app.registerModule(MyModule)

app.run()
