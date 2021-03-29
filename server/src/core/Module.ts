/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Socket } from 'socket.io'

import { Application } from './Application'

export abstract class Module {
	// ---- Attributes -------------------------------------------------------------------

	/** Application instance */
	private _app: Application
	/** Connected sockets */
	private _sockets: Socket[]

	// ---- Basics ---------------------------------------------------------------------------

	constructor(app: Application) {
		this._app = app
		// Note: this doesn't copy the array from the application but makes a reference to it
		// (https://javascript.info/object-copy)
		this._sockets = app.sockets
	}

	/** Name of the module */
	abstract get name(): string

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
