import { Request, Response } from 'express'
import { verify } from 'jsonwebtoken'

import config from '../config'
import { Application, Module } from '../core'
import { IUserSchema, User, UserJWTPayload } from '../models'

// NOTE: Small tweak to define possible session content from express
// See https://stackoverflow.com/a/65696437
declare module 'express-session' {
	interface SessionData {
		user?: IUserSchema
	}
}

// ---- Module ---------------------------------------------------------------------------
export class UserModule extends Module {
	/**
	 * Allow user login, logout and registering
	 * @param app Application
	 */
	constructor(app: Application) {
		super(app, 'UserModule')

		this.addEndpoints([
			{ type: 'HTTP', method: 'POST', path: '/login', handle: this.postLoginHandler.bind(this) },
			{ type: 'HTTP', method: 'POST', path: '/logout', handle: this.postLogoutHandler.bind(this) },
			{ type: 'HTTP', method: 'POST', path: '/register', handle: this.postRegisterHandler.bind(this) }
		])
	}

	// ---- Routes -----------------------------------------------------------------------

	/**
	 * Handle /login POST route: Attempt to authenticate the user and send its information back
	 *
	 * Query parameters:
	 *
	 * 	- email <email> (mandatory) - Email of the user
	 * 		eg: /login?email=test.test@test.test
	 *
	 * 	- password <password> (mandatory) - Password (clear) of the user
	 * 		eg: /login?email=test.test@test.test&password=passw0rd
	 *
	 *  Response: { message: 'success', user: UserSchema }
	 *
	 * ```typescript
	 * const email = '...'
	 * const password = '...'
	 *
	 * const user = await fetch(`/login?email=${email}&password=${password}`, { method: 'POST' })
	 * 		.then((res) => res.json())
	 *
	 * if(!user.error) {
	 * 		console.log('Login successful !')
	 *
	 * 		localStorage.setItem('user.email', user.email)
	 * 		localStorage.setItem('user.token', user.token)
	 * }
	 * ```
	 */
	public async postLoginHandler(req: Request, res: Response): Promise<void> {
		const { email, password } = req?.query ?? {}

		try {
			// Check if email and password are not undefined
			if (!email || !password) {
				// No email or password --> Error: Missing arguments
				res.status(400)
				res.json({
					error: 'Missing arguments',
					message: 'Missing one or many of the following parameters: email,password'
				})

				return res.end()
			}

			const user = await User.authenticate(email as string, password as string)

			// Check if there is user
			if (!user) {
				// No user found --> Error: Invalid credentials
				res.status(400)
				res.json({
					error: 'Invalid credentials',
					message: 'No user matching the given credentials'
				})

				return res.end()
			}

			// Hide user password before sending it to the client
			user.password = '********'

			req.session.user = user
			res.status(200)
			res.json({ message: 'success', user: user.toJSON() })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.status(500)
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/**
	 * Handle /register POST route: Attempt to crete a new user of the given type (default: 'USER')
	 *
	 * Query parameters:
	 *
	 * 	- email <email> (mandatory) - Email of the new user
	 * 		eg: /register?email=test.test@test.test
	 *
	 * 	- password <password> (mandatory) - Password (clear) of the new user
	 * 		eg: /register?email=test.test@test.test&password=passw0rd
	 *
	 * 	- token <token> (mandatory) - JWT user token of the admin account that is creating the new user
	 * 		eg: /register?email=test.test@test.test&password=passw0rd&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkIiwiaWF0IjoxNjE4ODIyNDgyfQ.FHDzAl7aWGW9GfUbc2n-B23VPk4aVa6cEdqU3ryvuR4
	 *
	 * 	- type <type> (facultative) - Type of account ('USER' or 'ADMIN')
	 * 		eg: /register?email=test.test@test.test&password=passw0rd&type=ADMIN&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkIiwiaWF0IjoxNjE4ODIyNDgyfQ.FHDzAl7aWGW9GfUbc2n-B23VPk4aVa6cEdqU3ryvuR4
	 * 		eg: /register?email=test.test@test.test&password=passw0rd&type=USER&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkIiwiaWF0IjoxNjE4ODIyNDgyfQ.FHDzAl7aWGW9GfUbc2n-B23VPk4aVa6cEdqU3ryvuR4
	 *
	 *  Response: { message: 'success', user: UserSchema }
	 *
	 * ```typescript
	 * const email = '...'
	 * const password = '...'
	 * const token = '...'
	 *
	 * const user = await fetch(`/register?email=${email}&password=${password}&token=${token}`, { method: 'POST' })
	 * 		.then((res) => res.json())
	 *
	 * if(!user.error) {
	 * 		console.log('User successfully created !')
	 *
	 * 		console.log(user) // { email: '...', password: '...', type: '...', token: null }
	 * }
	 * ```
	 */
	public async postRegisterHandler(req: Request, res: Response): Promise<void> {
		const { email, password } = req?.query ?? {}
		const { token } = req?.query ?? req?.session?.user ?? {}
		const type = req?.query?.type ?? 'USER'

		try {
			// Check for fields
			if (!email || !password || !token) {
				// No email, password or token --> Error: Missing arguments
				res.status(400)
				res.json({
					error: 'Missing arguments',
					message: 'Missing one or many of the following parameters: email,password,token'
				})

				return res.end()
			}

			// NOTE: We could add a validation step for the email adresse here

			const admin = await User.getByToken(token as string)

			// Check for credentials
			if (!admin || (admin && admin.type !== 'ADMIN')) {
				// No user found from the token OR the user is not an admin --> Error: Invalid credentials
				res.status(401)
				res.json({
					error: 'Insuffisant permissions',
					message: "The given token doesn't not refer to an active session of an admin account"
				})

				return res.end()
			}

			// Check for already existing user
			if (await User.exists({ email: email as string })) {
				// A user already exists with this email --> Error: Email already take
				res.status(400)
				res.json({
					error: 'Email already taken',
					message: `An active account already exists with this email address: ${email}`
				})

				return res.end()
			}

			// Create and save the new user
			const user = new User({
				email: email as string,
				password: await User.hashPassword(password as string),
				type: type as string
			})
			await user.save()

			// Hide user password before sending it to the client
			user.password = '********'

			res.status(201)
			res.json({ message: 'success', user })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.status(500)
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/**
	 * Handle /logout POST route: Logout the user if it exists
	 *
	 * Query parameters:
	 * 	- token <token> (mandatory) - Token of the user that is attempting to logout
	 * 		eg: /logout?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkIiwiaWF0IjoxNjE4ODIyNDgyfQ.FHDzAl7aWGW9GfUbc2n-B23VPk4aVa6cEdqU3ryvuR4
	 *
	 * Response: { message: 'success', disconnected: true }
	 *
	 * ```typescript
	 * const token = '...'
	 *
	 * const res = await fetch(`/logout?token=${token}`, { method: 'POST' })
	 * 		.then((res) => res.json())
	 *
	 * if(!res.error) {
	 * 		console.log('Disconnected successfully !')
	 * }
	 * ```
	 */
	public async postLogoutHandler(req: Request, res: Response): Promise<void> {
		// NOTE: Session might not work as the client might be working with fetch, consider only the given query parameters
		//	, the session is here "in case of" but may be removed in the future
		const { token } = req?.query ?? req?.session?.user ?? {}

		try {
			// Check if the token is not undefined
			if (!token) {
				// No token --> Error: Missing arguments
				res.status(400)
				res.json({
					error: 'Missing arguments',
					message: 'Missing one or many of the following parameters: token'
				})

				return res.end()
			}

			// Get the user thanks to the ID store in the payload
			const payload: UserJWTPayload = verify(token as string, config.security.secret) as UserJWTPayload
			const user = await User.findById(payload.userId)

			if (user) {
				// Unset the token and save
				user.token = null
				await user.save()

				res.status(200)
				res.json({ message: 'success', disconnected: true })

				return res.end()
			}
		} catch (error) {
			// Error caught --> Something went wrong
			res.status(400)
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}
}
