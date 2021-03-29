import debug from 'debug'
import express, { NextFunction, Request, Response } from 'express'
import http from 'http'
import path from 'path'
import SocketIO, { Socket } from 'socket.io'

import { Constructor as Instantiable } from './Instantiable'
import { Module } from './Module'

const log = debug('core:Application')

// ---- Interfaces -----------------------------------------------------------------------

/**
 * Options of the Application
 */
export interface AppOptions {
	/** Server public path, default: null */
	public?: string
	/** Server port, default: 3000 */
	port?: number
}

// ---- Interfaces: Endpoint -------------------------------------------------------------

/**
 * Common base for each type of Endpoint
 */
export interface EndpointBase {
	path: string
	handler: (path: string, ...args: any[]) => any
}

/**
 * Interface of an HTTP endpoint, must be used by modules to register a new HTTP endpoint in the application
 */
export interface HTTPEndpoint extends EndpointBase {
	type: 'HTTP'
	handler: (path: string, req: Request, res: Response, next: NextFunction) => any
}

/**
 * Interface of a socket endpoint, must be used by modules to register a new socket endpoint in the application
 */
export interface SocketEndpoint extends EndpointBase {
	type: 'Socket'
	handler: (path: string, socket: Socket) => any
}

/**
 * Complete endpoint interface
 */
export type Endpoint = HTTPEndpoint | SocketEndpoint

// ---- Application ----------------------------------------------------------------------

/**
 * @class Application object that register the components and start the server
 */
export class Application {
	// ---- Attributes -------------------------------------------------------------------

	// Options
	/* Given options */
	private _options: AppOptions
	/* Public path */
	private _public: string | null
	/* Port */
	private _port: number

	// Server
	/** Express application */
	private _app: express.Application
	/** HTTP server from express */
	private _server: http.Server
	/** SocketIO server */
	private _io: SocketIO.Server

	// Modules
	/** Registered modules */
	private _modules: Module[]
	/** Connected sockets */
	private _sockets: Socket[]

	// ---- Configuration ----------------------------------------------------------------

	constructor(options: AppOptions = {}) {
		// Read options
		this._public = path.resolve(options.public) ?? null
		log(this._public ? `Public path set on ${this._public}` : 'No public path')

		this._port = options.port ?? 3000
		log(`Port set on ${this._port}`)

		// Initialize data
		this._modules = []
		this._sockets = []

		// Initialize server
		this._app = express()
		this._server = http.createServer(this._app)
		this._io = new SocketIO.Server(this._server)

		// Set event handlers scope
		this.onSocketJoin = this.onSocketJoin.bind(this)
	}

	// ---- Modules ----------------------------------------------------------------------

	/**
	 * Instantiate and link a module to the Application
	 * @param moduleClass Class of the module to register
	 * @returns The instance of the module
	 */
	public registerModule(moduleClass: Instantiable<Module>): Module {
		const module = new moduleClass(this)

		this._modules.push(module)
		log(`Module '${module.name}' registered`)

		return module
	}

	// ---- Sockets ----------------------------------------------------------------------

	/**
	 * Spread client socket connection information
	 * @param socket Client socket
	 */
	private onSocketJoin(socket: Socket): void {
		const { id } = socket

		this._sockets.push(socket)
		this._modules.forEach((module) => module.onSocketJoin(socket))

		log(`Socket connected: ${id}, stored`)

		socket.on('disconnect', () => {
			this._sockets = this._sockets.filter((s) => s.id !== id)
			this._modules.forEach((module) => module.onSocketLeave(socket))

			log(`Socket disconnected: ${id}, removed`)
		})
	}

	get sockets(): Socket[] {
		return this._sockets
	}

	// ---- Running ----------------------------------------------------------------------

	/**
	 * Start the server
	 * @returns The instance of the HTTP server
	 */
	public run(): http.Server {
		const { _app: app, _io: io, _server: server, _port: port, _public: pub } = this

		if (pub) app.use(express.static(pub))

		io.on('connection', this.onSocketJoin)

		return server.listen(port, () => {
			log(`Server started on port ${port}`)
			log(`http://localhost:${port}`)
		})
	}
}
