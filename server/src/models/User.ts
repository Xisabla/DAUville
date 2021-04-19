import { compare, hash } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { Document, Model, model, Schema } from 'mongoose'
import { v4 as uuid } from 'uuid'

import config from '../config'

/**
 * Content of the JWT user's payload
 */
export interface UserJWTPayload {
	userId: string
	params: {
		_uuid: string
		[key: string]: any
	}
	iat: number
}

// ---- Schema interface -----------------------------------------------------------------
export interface IUserSchema extends Document {
	/** Email address of the user */
	email: string
	/** Hashed password of the user */
	password: string
	/** Account type: user (normal user) or admin */
	type: 'ADMIN' | 'USER'
	/** JSON Web Token for authentication */
	token?: string

	// Methods
	/**
	 * Check if the given plain text password matchs the user's password
	 * @param password Plain text password
	 * @returns True if the password match, false otherwise
	 *
	 * ```typescript
	 * const password = '...'
	 * const user = User.findOne({ ... })
	 *
	 * if (await user.checkPassword(password)) {
	 * 		console.log('Good password !')
	 * } else {
	 * 		console.log('Wrong password !')
	 * }
	 * ```
	 */
	checkPassword(password: string): Promise<boolean>

	/**
	 * Generate a token for the user
	 * @param params Parameters to add to the token
	 * @returns The generated JWT
	 *
	 * ```typescript
	 * const user = User.findOne({ ... })
	 *
	 * if(await user.checkPassword(password)) {
	 * 		const token = await user.generateToken({ loggedAt: new Date() })
	 *
	 * 		console.log(`My new user token is ${token}`)
	 * }
	 * ```
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	generateToken(params?: object): Promise<string>
}

// ---- Schema ---------------------------------------------------------------------------
export const UserSchema = new Schema<IUserSchema, Model<IUserSchema>>(
	{
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		type: {
			type: String,
			required: true,
			default: 'ADMIN',
			validate: (val: string) => ['ADMIN', 'USER'].includes(val.toUpperCase())
		},
		token: { type: String, required: false, default: null }
	},
	{ collection: 'users', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export interface IUser extends Model<IUserSchema> {
	// Statics

	/**
	 * Check for user credentials, generate its token and return information
	 * @param email Email credentials
	 * @param password Password credentials
	 * @param params Parameters to given to the token creation (default: undefined)
	 * @returns The user instance if a user matches the credentials, false otherwise
	 *
	 * ```typescript
	 * const email = '...'
	 * const password = '...'
	 * const user = await User.authenticate(email, password, { ...tokenParams })
	 *
	 * if(user) {
	 * 		console.log('Connection successful !')
	 * }
	 * ```
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	authenticate(email: string, password: string, params?: object): Promise<IUserSchema | false>

	/**
	 * Check if a hashed password correspond to a plain text password
	 * @param password Password to compare to the hash
	 * @param hash Hash to compare to the password
	 * @returns True if the password and the hash match, false otherwise
	 *
	 * ```typescript
	 * await User.checkPassword('password', '$2b$10$ZcXGphJNeWfjc6F0klucDe1SRvh6XOLbgAop/RoBg.U3eXEGnP6xm')
	 * // -> true
	 *
	 * await User.checkPassword('passw0rd', '$2b$10$ZcXGphJNeWfjc6F0klucDe1SRvh6XOLbgAop/RoBg.U3eXEGnP6xm')
	 * // -> false
	 * ```
	 */
	checkPassword(password: string, hash: string): Promise<boolean>

	/**
	 * Check if a user already exist with a given email address
	 * @param email Email address to check
	 * @returns True if a user already exist with the given email address, false otherwise
	 *
	 * ```typescript
	 * const email = '...'
	 *
	 * if(await User.doesExist(email)) {
	 * 		console.log('A user already exists with this email address !')
	 * }
	 * ```
	 */
	doesExist(email: string): Promise<boolean>

	/**
	 * Get a user by its token
	 * @param token JWT of the current session of the user, will be used to get the user id
	 * @returns The User if there is any user matching (matching ID from the payload AND the token), false otherwise
	 *
	 * ```typescript
	 * const token = '...'
	 * const user = await User.getByToken(token)
	 *
	 * if(user) {
	 * 		console.log('Session reconnected via token !')
	 * }
	 * ```
	 */
	getByToken(token: string): Promise<IUserSchema | false>

	/**
	 * Hash a plain text password
	 * @param password Password to hash
	 * @returns The hashed password
	 *
	 * ```typescript
	 * const password = '...'
	 * const hashed = await User.hashPassword(password)
	 * ```
	 */
	hashPassword(password: string): Promise<string>
}

// ---- Methods --------------------------------------------------------------------------
/** Check if the given plain text password matchs the user's password */
UserSchema.methods.checkPassword = async function (password: string): Promise<boolean> {
	return await User.checkPassword(password, this.password)
}

/** Generate a token for the user */
UserSchema.methods.generateToken = async function (params = {}): Promise<string> {
	// Add a UUID to the parameters to make sure it will be a new token
	params._uuid = uuid()

	// Create the token and
	const token = sign({ ...{ userId: this._id }, ...{ params } }, config.security.secret)

	// Assign and save
	this.token = token
	await this.save()

	return token
}

// ---- Statics --------------------------------------------------------------------------
/** Check for user credentials, generate its token and return information */
UserSchema.statics.authenticate = async function (
	email: string,
	password: string,
	params = {}
): Promise<IUserSchema | false> {
	const user = await User.findOne({ email })

	// If a user is found and the provided password matches
	if (user && (await user.checkPassword(password))) {
		// Generates new user token
		await user.generateToken(params)

		return user
	}

	return false
}

/** Check if a hashed password correspond to a plain text password */
UserSchema.statics.checkPassword = async function (password: string, hash: string): Promise<boolean> {
	return await compare(password, hash)
}

/** Check if a user already exist with a given email address */
UserSchema.statics.doesExist = async function (email: string): Promise<boolean> {
	const user = await User.findOne({ email })

	return user ? true : false
}

/** Get a user by its token */
UserSchema.statics.getByToken = async function (token: string): Promise<IUserSchema | false> {
	try {
		const payload: UserJWTPayload = verify(token as string, config.security.secret) as UserJWTPayload
		const user = await User.findById(payload.userId)

		if (user && user.token === token) return user
	} catch (error) {
		return false
	}

	return false
}

/** Hash a plain text password */
UserSchema.statics.hashPassword = async function (password: string): Promise<string> {
	return await hash(password, config.security.saltRounds)
}

// ---- Model ----------------------------------------------------------------------------
export const User = model<IUserSchema, IUser>('User', UserSchema)
