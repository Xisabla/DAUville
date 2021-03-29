import { Socket } from 'socket.io'

import { Application } from './core/Application'
import { Module } from './core/Module'

const app = new Application({ public: '../client/public' })

// Note: This is just an example for testing
class MyModule extends Module {
	constructor(app: Application) {
		super(app)

		console.log('HELLO THERE')
	}

	get name() {
		return 'MyModule'
	}

	public onSocketJoin(socket: Socket): void {
		console.log(`Socket ${socket.id} joined (from ${this.name})`)
	}
}

// ---- Register modules -----------------------------------------------------------------
app.registerModule(MyModule)

app.run()
