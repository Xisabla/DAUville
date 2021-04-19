/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import debug, { Debugger } from 'debug'
import { Socket } from 'socket.io'

import { Application, Endpoint, Task, TaskAction, TaskSchedule } from './'

export abstract class Module {
	// ---- Attributes -------------------------------------------------------------------

	/** Module ID */
	protected readonly _id: number
	/** Application instance */
	protected readonly _app: Application
	/** Module logger */
	protected readonly _log: Debugger
	/** Connected sockets */
	protected _sockets: Socket[]
	/** Module endpoints */
	private _endpoints: Endpoint[]

	/** Module name */
	protected readonly _name: string
	/** Should the application wait for the init method */
	private _wait: boolean
	/** Module init promise */
	private _init: Promise<any>

	/** ID counter */
	private static _counter = 0

	// ---- Basics -----------------------------------------------------------------------

	/**
	 * Object that describes a module of the Application
	 * @param app The Application
	 * @param name The name of the module
	 * @param autoInit Should the Module run the async init method (default: true)
	 * @param wait Should the Application wait for the module's init method to end (default: true)
	 *
	 * ```typescript
	 * export class MyModule extends Module {
	 * 		constructor(app: Application) {
	 * 			super(app, 'MyModuleName', true, true)
	 * 		}
	 * }
	 * ```
	 */
	constructor(app: Application, name?: string, autoInit = true, wait = true) {
		this._app = app
		this._name = name ?? `Module#${Module._counter++}`
		this._wait = wait
		// Note: this doesn't copy the array from the application but makes a reference to it
		// (https://javascript.info/object-copy)
		this._sockets = app.sockets
		this._log = debug(`module:${name}`)
		this._endpoints = []

		this.initialize(autoInit)
	}

	/**
	 * Set the wait flag to the given value
	 * @param wait New wait flag value
	 *
	 * ```typescript
	 * setWait(true/false)
	 * ```
	 */
	public setWait(wait: boolean): void {
		this._wait = wait
	}

	/**
	 * If autoInit is set on true, will run the init async method and put the result of the Promise
	 * 	in a variable that can be get by the application. This will allow the Application to be notified
	 * 	at the end of the init method of the Module
	 * If autoInit is set on false, will just put a Promise.resolve() in the init variable
	 * @param autoInit Should the Application run the init method
	 *
	 * ```typescript
	 * initialize(true/false)
	 * ```
	 */
	protected initialize(autoInit: boolean): void {
		this._init = autoInit ? this.init() : Promise.resolve()
	}

	/**
	 * Init method that is made to be overwritten with any async initialization that the server has
	 * 	to wait to be over before starting
	 * @returns A promise of the async process
	 *
	 * ```typescript
	 * await this.init()
	 * console.log('Module initialization done.')
	 * // Do stuff that has to wait the init
	 * ```
	 */
	protected async init(): Promise<any> {
		return Promise.resolve()
	}

	/** Name of the module */
	get name(): string {
		return this._name
	}

	/** Should the Application wait for the Module to initialize */
	get wait(): boolean {
		return this._wait
	}

	/** Returns the init promise to know if the module init is done or not */
	get initPromise(): Promise<any> {
		return this._init
	}

	// ---- Endpoints --------------------------------------------------------------------

	/**
	 * Add an endpoint to the module endpoints
	 * @param endpoint Endpoint to add
	 *
	 * ```typescript
	 * addEndpoint(myEndpoint)
	 * ```
	 */
	protected addEndpoint(endpoint: Endpoint): void {
		this._endpoints.push(endpoint)
	}

	/**
	 * Add multiple endpoints
	 *
	 * ```typescript
	 * addEndpoints([ endpoint1, endpoint2, ... ])
	 * ```
	 */
	protected addEndpoints(endpoints: Endpoint[]): void {
		endpoints.map((endpoint) => this.addEndpoint(endpoint))
	}

	/** Endpoints of the Module */
	get endpoints(): Endpoint[] {
		return this._endpoints
	}

	// ---- Sockets ----------------------------------------------------------------------

	/**
	 * Listener for new client socket connection
	 * @param socket Client socket
	 *
	 * ```typescript
	 * // Application
	 * onSocketJoin((socket) => {
	 * 		this._modules.forEach((module) => {
	 * 			module.onSocketJoin(socket)
	 * 		})
	 * })
	 *
	 * // MyModule
	 * public onSocketJoin(socket) {
	 * 		console.log(`Socket ${socket.id} joined`)
	 * }
	 *
	 * // index.ts
	 * const app = new Application({...})
	 * ...
	 * app.registerModule(MyModule)
	 * ...
	 *
	 * // When a socket joins the server
	 * // console: "Socket xZicnuePG5WehCSKAAAB joined"
	 * ```
	 */
	public onSocketJoin(socket: Socket): any {}

	/**
	 * Listener for disconnected client sockets
	 * @param socket Client socket
	 *
	 * ```typescript
	 * // Application
	 * onSocketJoin((socket) => {
	 * 		...
	 * 		socket.on('disconnected', (socket) => {
	 * 			this.modules.forEach((module) => {
	 * 				module.onSocketLeave(socket)
	 * 			})
	 * 		})
	 * })
	 *
	 * // MyModule
	 * public onSocketLeave(socket) {
	 * 		console.log(`Socket ${socket.id} leaved`)
	 * }
	 *
	 * // index.ts
	 * const app = new Application({...})
	 * ...
	 * app.registerModule(MyModule)
	 * ...
	 *
	 * // When a socket leaves the server
	 * // console: "Socket xZicnuePG5WehCSKAAAB leaved"
	 * ```
	 */
	public onSocketLeave(socket: Socket): any {}

	// ---- Tasks ----------------------------------------------------------------------------

	/**
	 * Register a task
	 * @param schedule Schedule of the task: Date, Moment or cron schedule
	 * @param action Action the will be run on schedule
	 * @param start Does auto start (default: true)
	 * @returns The task
	 *
	 * ```typescript
	 * export class MyModule extends Module {
	 * 		constructor(app: Application) {
	 * 			...
	 *
	 * 			// Perform task every day at 10h00
	 * 			this.registerTask('* * 10 * * *', this.performMyTask.bind(this), true)
	 * 		}
	 *
	 * 		public async performMyTask() {
	 * 			...
	 * 		}
	 * }
	 */
	protected registerTask(schedule: TaskSchedule, action: TaskAction, start = true): Task {
		return new Task({ origin: this, schedule, action, start })
	}
}
