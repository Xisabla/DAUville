import { Request, Response } from 'express'
import { verify } from 'jsonwebtoken'

import config from '../config'
import { Application, Module } from '../core'
import { IUserSchema, User } from '../models'
import { UserJWTPayload } from '../models/User'

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

		this.addEndpoints([
			{ type: 'HTTP', method: 'POST', path: '/login', handle: this.postLoginHandler.bind(this) },
			{ type: 'HTTP', method: 'POST', path: '/logout', handle: this.postLogoutHandler.bind(this) }
		])
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

	/**
	 * Handle /logout POST route: Logout the user if it exists
	 */
	public async postLogoutHandler(req: Request, res: Response): Promise<void> {
		// NOTE: Session might not work as the client might be working with fetch, consider only the given query parameters
		//	, the session is here "in case of" but may be removed in the future
		const { token } = req?.query ?? req?.session?.user ?? {}

		try {
			// Check if the token is not undefined
			if (token) {
				// Get the user thanks to the ID store in the payload
				const payload: UserJWTPayload = verify(token as string, config.security.secret) as UserJWTPayload
				const user = await User.findById(payload.userId)

				if (user) {
					// Unset the token and save
					user.token = null
					await user.save()

					res.json({ disconnected: true })
				}
			} else {
				// No token --> Error: Missing arguments
				res.json({
					error: 'Missing arguments',
					message: 'Missing one or many of the following parameters: token'
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
}
