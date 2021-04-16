import { urlencoded } from 'body-parser'
import debug from 'debug'
import express, { Request, Response } from 'express'
import session from 'express-session'
import http from 'http'
import memorystore from 'memorystore'
import mongoose, { Mongoose } from 'mongoose'
import path from 'path'
import SocketIO, { Socket } from 'socket.io'

import config from '../config'
import {
	Constructor as Instantiable,
	Endpoint,
	EndpointList,
	EndpointPath,
	EndpointType,
	HTTPEndpoint,
	Module,
	SocketEndpoint
} from './'

const log = debug('core:Application')
const MemoryStore = memorystore(session)

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
	/** Should the application wait for the module ? (Overwrites Module settings, null = let the Module choose) */
	waitForModuleInit?: boolean
}

/**
 * Options for the Module Registering method
 */
export interface ModuleRegisteringOptions {
	/** Should the application wait for the module ? (Overwrites Module settings) */
	wait?: boolean
}

// ---- Application ----------------------------------------------------------------------

/**
 * @class Application object that register the components and start the server
 */
export class Application {
	// ---- Attributes -------------------------------------------------------------------

	// Options
	/* Given options */
	protected readonly _options: AppOptions
	/* Public path */
	protected readonly _public: string | null
	/* Port */
	protected readonly _port: number

	// Server
	/** Express application */
	protected readonly _app: express.Application
	/** HTTP server from express */
	protected readonly _server: http.Server
	/** SocketIO server */
	protected readonly _io: SocketIO.Server

	// Database
	/** Database asynchronous connection promise */
	protected _dbConnectionPromise: Promise<Mongoose | null>
	/** Application database instance */
	protected _db?: Mongoose

	// Modules
	/** Registered modules */
	protected _modules: Module[]
	/** Connected sockets */
	protected _sockets: Socket[]
	/** Registered endpoints */
	protected _endpoints: EndpointList

	// ---- Configuration ----------------------------------------------------------------

	/**
	 * Application object that handle the main working process of the project
	 * @param options Options of the Application
	 */
	constructor(options: AppOptions = {}) {
		// Read options
		this._options = options
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
		this._app.use(urlencoded({ extended: true }))
		this._app.use(
			session({
				cookie: { secure: true },
				saveUninitialized: true,
				store: new MemoryStore({
					checkPeriod: 86400000 // prune expired entries every 24h
				}),
				resave: false,
				secret: config.security.secret
			})
		)
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
				useFindAndModify: false,
				useCreateIndex: true,
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
	public async registerModule(
		moduleClass: Instantiable<Module>,
		options: ModuleRegisteringOptions = {}
	): Promise<Module> {
		const { _app: app } = this

		// As modules might need to access the database, we make sure that the connection is set before instantiating it
		await this._dbConnectionPromise

		const module = new moduleClass(this)

		// Set wait flag (if necessary)
		if (this._options.waitForModuleInit !== null && this._options.waitForModuleInit !== undefined)
			module.setWait(this._options.waitForModuleInit)
		if (options.wait !== null && options.wait !== undefined) module.setWait(options.wait)

		this._modules.push(module)
		this._endpoints.addMany(module.endpoints)

		// Map HTTP Requests, Socket requests are seeked at runtime
		module.endpoints
			.filter((endpoint) => endpoint.type === 'HTTP')
			.forEach((edp) => {
				const endpoint = edp as HTTPEndpoint

				switch (endpoint.method) {
					case 'DELETE': {
						app.delete(endpoint.path, endpoint.handle)
						break
					}
					case 'PATCH': {
						app.patch(endpoint.path, endpoint.handle)
						break
					}
					case 'POST': {
						app.post(endpoint.path, endpoint.handle)
						break
					}
					case 'PUT': {
						app.put(endpoint.path, endpoint.handle)
						break
					}
					default:
					case 'GET': {
						app.get(endpoint.path, endpoint.handle)
						break
					}
				}
			})

		log(`Module '${module.name}' registered, ${module.endpoints.length} endpoint(s) added`)

		return module
	}

	/**
	 * Fetch the endpoint matching the path and type
	 * @param path Path to match
	 * @param type Endpoint type to match
	 * @returns The endpoint if one is found, otherwise null
	 */
	public getEndpoint(path: EndpointPath, type: EndpointType): Endpoint | null {
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
		const edp: Endpoint | null = this.getEndpoint(path, 'Socket')

		// Check for matching endpoint
		if (edp) {
			log(`Request from ${socket.id} with path '${path}', redirected to endpoint`)

			const endpoint = edp as SocketEndpoint
			return endpoint.handle(path as EndpointPath, data, socket)
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
	 * @returns The Promises results of the init methods of all modules that have the wait flag at true
	 */
	private async ensureModulesInit(): Promise<any[]> {
		return await Promise.all(this._modules.filter((module) => module.wait).map((module) => module.initPromise))
	}

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
		await this.ensureModulesInit()

		// By default: redirect all wrong GET requests to homepage
		app.get('*', (req: Request, res: Response) => res.redirect('/'))

		// Start the server
		return server.listen(port, () => {
			log(`Server started on port ${port}`)
			log(`http://localhost:${port}`)
		})
	}
}
