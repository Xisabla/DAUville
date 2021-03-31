/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import debug, { Debugger } from 'debug'
import { Socket } from 'socket.io'

import { Application } from './Application'
import { Endpoint, EndpointPath } from './Endpoint'

export abstract class Module {
	// ---- Attributes -------------------------------------------------------------------

	/** Application instance */
	private _app: Application
	/** Connected sockets */
	private _sockets: Socket[]
	/** Module endpoints */
	private _endpoints: Endpoint[]
	/** Module logger */
	protected readonly _log: Debugger

	/** Module name */
	protected _name: string

	// ---- Basics -----------------------------------------------------------------------

	constructor(app: Application, name: string) {
		this._app = app
		this._name = name
		// Note: this doesn't copy the array from the application but makes a reference to it
		// (https://javascript.info/object-copy)
		this._sockets = app.sockets
		this._log = debug(`module:${name}`)
		this._endpoints = []
	}

	/** Name of the module */
	get name(): string {
		return this._name
	}

	// ---- Endpoints --------------------------------------------------------------------

	/**
	 * Add an endpoint to the module endpoints
	 * @param endpoint Endpoint to add
	 */
	protected addEndpoint(endpoint: Endpoint): void {
		this._endpoints.push(endpoint)
	}

	get endpoints(): Endpoint[] {
		return this._endpoints
	}

	// ---- Sockets ----------------------------------------------------------------------

	/**
	 * Listener for new client socket connection
	 * @param socket Client socket
	 */
	public onSocketJoin(socket: Socket): any {}

	/**
	 * Listener for disconnected client sockets
	 * @param socket Client socket
	 */
	public onSocketLeave(socket: Socket): any {}
}
