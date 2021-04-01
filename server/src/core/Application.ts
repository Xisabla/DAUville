import debug from 'debug'
import express from 'express'
import http from 'http'
import mongoose, { Mongoose } from 'mongoose'
import path from 'path'
import SocketIO, { Socket } from 'socket.io'

import { Endpoint, EndpointList, EndpointPath, EndpointType, SocketEndpoint } from './Endpoint'
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
	/** Mongo database connect information */
	db?: {
		/** Database access url */
		url: string
		/** Database access user */
		user?: string
		/** Database user's password */
		pass?: string
		/** Database name */
		dbname?: string
	}
}

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

	// Database
	/** Database asynchronous connection promise */
	private _dbConnectionPromise: Promise<Mongoose | null>
	/** Application database instance */
	private _db?: Mongoose

	// Modules
	/** Registered modules */
	private _modules: Module[]
	/** Connected sockets */
	private _sockets: Socket[]
	/** Registered endpoints */
	private _endpoints: EndpointList

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
		this._endpoints = new EndpointList()

		// Initialize server
		this._app = express()
		this._server = http.createServer(this._app)
		this._io = new SocketIO.Server(this._server)

		// Initialize DB connection
		this._dbConnectionPromise = options.db
			? this.connectDatabase(options.db)
			: new Promise((resolve) => resolve(null))

		// Set event handlers scope
		this.onSocketJoin = this.onSocketJoin.bind(this)
	}

	// ---- Database -------------------------------------------------------------------------

	/**
	 * Try to connect to the mongo database
	 * @param options Credentials
	 * @returns Mongoose instance
	 */
	private connectDatabase(options: AppOptions['db']): Promise<Mongoose> {
		const { url, user, pass, dbname: dbName } = options

		log('Attempting to connect to mongodb server:', url)

		return mongoose
			.connect(url, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				user,
				pass,
				dbName
			})
			.then((db) => {
				this._db = db

				log('Successfully connected to the database')

				return db
			})
			.catch((err) => {
				log(`Unable to connect to the database: ${err}`)
				log(
					'The application will still try to run without the database connection, it might occur some errors or crash'
				)
				return err
			})
	}

	get db(): Mongoose {
		return this._db
	}

	// ---- Modules ----------------------------------------------------------------------

	/**
	 * Instantiate and link a module to the Application
	 * @param moduleClass Class of the module to register
	 * @returns The instance of the module
	 */
	public async registerModule(moduleClass: Instantiable<Module>): Promise<Module> {
		// As modules might need to access the database, we make sure that the connection is set before instantiating it
		await this._dbConnectionPromise

		const module = new moduleClass(this)

		this._modules.push(module)
		this._endpoints.addMany(module.endpoints)
		log(`Module '${module.name}' registered, ${module.endpoints.length} endpoint(s) added`)

		return module
	}

	/**
	 * Fetch the endpoint matching the path and type
	 * @param path Path to match
	 * @param type Endpoint type to match
	 * @returns The endpoint if one is found, otherwise null
	 */
	private getEndpoint(path: EndpointPath, type: EndpointType): Endpoint | null {
		const endpoints = this._endpoints.find({ path, type })

		return endpoints.length > 0 ? endpoints[endpoints.length - 1] : null
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
		log(`Socket ${socket.id} connected`)

		// Listen for socket requests
		this.listenSocketRequests(socket)

		// Remove leaving sockets
		socket.on('disconnect', () => {
			this._sockets = this._sockets.filter((s) => s.id !== id)
			this._modules.forEach((module) => module.onSocketLeave(socket))

			log(`Socket disconnected: ${id}`)
		})
	}

	/**
	 * Listen to requests from the socket to redirect them
	 * @param socket Socket to listen to the requests from
	 * @returns Whatever the handler returns
	 */
	private listenSocketRequests(socket: Socket): any {
		socket.on('request', (data: any) => {
			// Check for valid arguments
			if (data?.path) {
				return this.handleSocketRequest(socket, data.path, data)
			} else {
				log(`Request from ${socket.id} without path, redirecting to default path '/'`)

				return this.handleSocketRequest(socket, '/', data)
			}
		})
	}

	/**
	 * Find the good handler and use it for the incoming request
	 * @param socket Socket to handle the request from
	 * @param path Path of the request
	 * @param data Data transmitted by the socket
	 * @returns Whatever the handler returns
	 */
	private handleSocketRequest(socket: Socket, path: EndpointPath, data: any): any {
		const endpoint: Endpoint | null = this.getEndpoint(path, 'Socket')

		// Check for matching endpoint
		if (endpoint) {
			log(`Request from ${socket.id} with path '${path}', redirected to endpoint`)

			const _endpoint = endpoint as SocketEndpoint
			return _endpoint.handle(path as EndpointPath, data, socket)
		} else {
			// TODO: No endpoint, send error
			log(`Request from ${socket.id} with path '${path}', no matching endpoint`)

			return null
		}
	}

	get sockets(): Socket[] {
		return this._sockets
	}

	// ---- Running ----------------------------------------------------------------------

	/**
	 * Start the server
	 * @returns The instance of the HTTP server
	 */
	public async run(): Promise<http.Server> {
		const { _app: app, _io: io, _server: server, _port: port, _public: pub } = this

		if (pub) app.use(express.static(pub))

		io.on('connection', this.onSocketJoin)

		// Wait for db connection
		await this._dbConnectionPromise

		// Start the server
		return server.listen(port, () => {
			log(`Server started on port ${port}`)
			log(`http://localhost:${port}`)
		})
	}
}
