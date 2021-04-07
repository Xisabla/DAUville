import { RequestHandler } from 'express'
import { Socket } from 'socket.io'

// ---- Interfaces -----------------------------------------------------------------------

/**
 * Endpoint path are just basic strings
 */
export type EndpointPath = string

/**
 * Endpoint type definition for http endpoints
 */
export type HTTPEndpointType = 'HTTP'

/**
 * Endpoint handler for http endpoints
 */
export type HTTPEndpointHandler = RequestHandler

/**
 * Interface of an http endpoint, must be used by modules to register a new HTTP endpoint in the application
 */
export interface HTTPEndpoint {
	type: HTTPEndpointType
	method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
	path: EndpointPath
	handle: HTTPEndpointHandler
}

/**
 * Endpoint type definition for socket endpoints
 */
export type SocketEndpointType = 'Socket'

/**
 * Endpoint handler for socket endpoints
 */
export type SocketEndpointHandler = (path: EndpointPath, data: any[], socket: Socket) => any

/**
 * Interface of a socket endpoint, must be used by modules to register a new socket endpoint in the application
 */
export interface SocketEndpoint {
	type: SocketEndpointType
	path: EndpointPath
	handle: SocketEndpointHandler
}

/**
 * Complete endpoint type interface
 */
export type EndpointType = HTTPEndpointType | SocketEndpointType

/**
 * Complete endpoint interface
 */
export type Endpoint = HTTPEndpoint | SocketEndpoint

// ---- Classes --------------------------------------------------------------------------

/**
 * @class List of endpoints with specific methods
 */
export class EndpointList {
	private _endpoints: Endpoint[]

	constructor(...endpoints: Endpoint[]) {
		this._endpoints = endpoints ?? []
	}

	/**
	 * Add an endpoint to the endpoint list
	 * @param endpoint Endpoint to add
	 */
	public add(endpoint: Endpoint) {
		this._endpoints.push(endpoint)
	}

	/**
	 * Add multiple endpoints to the endpoint list
	 * @param endpoints Endpoints to add
	 */
	public addMany(endpoints: Endpoint[]) {
		this._endpoints = [...this._endpoints, ...endpoints]
	}

	/**
	 * Checks if the given path matchs the given endpoint
	 * @param endpoint Endpoint to check
	 * @param path Path to check
	 * @returns True if the path matchs the endpoint
	 */
	public static isPathMatching(endpoint: Endpoint, path: EndpointPath) {
		// TODO: Check for wildcards and all the stuff instead of this:
		return endpoint.path.toUpperCase() === path.toUpperCase()
	}

	/**
	 * Find matching endpoints for the selection
	 * @param selector Path that has to match the endpoint and (facultative) type of the endpoint
	 * @returns All the matching endpoints
	 */
	public find(selector: { path: EndpointPath; type?: EndpointType }) {
		const { path, type } = selector
		const endpoints = type ? this._endpoints.filter((endpoint) => endpoint.type === type) : this._endpoints

		return endpoints.filter((endpoint) => EndpointList.isPathMatching(endpoint, path))
	}
}
