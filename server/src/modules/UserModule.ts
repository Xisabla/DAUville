import { Request, Response } from 'express'

import { Application, Module } from '../core'
import { IUserSchema, User } from '../models'

// NOTE: Small tweak to define possible session content from express
// See https://stackoverflow.com/a/65696437
declare module 'express-session' {
	interface SessionData {
		user?: IUserSchema
	}
}

// ---- Module ---------------------------------------------------------------------------
export class UserModule extends Module {
	constructor(app: Application) {
		super(app, 'UserModule')

		this.addEndpoint({ type: 'HTTP', method: 'POST', path: '/login', handle: this.postLoginHandler.bind(this) })
	}

	/**
	 * Handle /login POST route: Attempt to authenticate the user and send its information back
	 */
	public async postLoginHandler(req: Request, res: Response): Promise<void> {
		const { email, password } = req?.query ?? {}

		try {
			// Check if email and password are not undefined
			if (email && password) {
				const user = await User.authenticate(email as string, password as string)

				// Check if there is user
				if (user) {
					// Hide user password before sending it to the client
					user.password = '********'

					req.session.user = user
					res.json({ user: user.toJSON() })
				} else {
					// No user found --> Error: Invalid credentials
					res.json({
						error: 'Invalid credentials',
						message: 'No user matching the given credentials'
					})
				}
			} else {
				// No email or password --> Error: Missing arguments
				res.json({
					error: 'Missing arguments',
					message: 'Missing one or many of the following parameters: email,password'
				})
			}
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})
		}

		return res.end()
	}

	// TODO: register: check rights of the creator (send errors), create and save user (sens errors), end: send info
	// TODO: disconnect: get user by token (skip errors), break token: send info/error
}
