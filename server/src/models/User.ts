import { compare, hash } from 'bcrypt'
import { Document, Model, model, Schema } from 'mongoose'

// ---- Schema interface -----------------------------------------------------------------
export interface IUserSchema extends Document {
	/** Email address of the user */
	email: string
	/** Hashed password of the user */
	password: string

	// Methods
	/** Check if the given plain text password matchs the user's password */
	checkPassword(password: string): Promise<boolean>
}

// ---- Schema ---------------------------------------------------------------------------
export const UserSchema = new Schema<IUserSchema, Model<IUserSchema>>(
	{
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true }
	},
	{ collection: 'users' }
)

// ---- Model Interface ------------------------------------------------------------------
export interface IUser extends Model<IUserSchema> {
	// Statics
	/** Check if a user already exist with a given email address */
	doesExist(email: string): Promise<boolean>
	/** Hash a plain text password */
	hashPassword(password: string): Promise<string>
	/** Check if a hashed password correspond to a plain text password */
	checkPassword(password: string, hash: string): Promise<boolean>
}

// ---- Methods --------------------------------------------------------------------------
/**
 * Check if the given plain text password matchs the user's password
 * @param password Plain text password
 * @returns True if the password match, false otherwise
 */
UserSchema.methods.checkPassword = async function (password: string): Promise<boolean> {
	return await User.checkPassword(password, this.password)
}

// ---- Statics --------------------------------------------------------------------------
/**
 * Check if a user already exist with a given email address
 * @param email Email address to check
 * @returns True if a user already exist with the given email address, false otherwise
 */
UserSchema.statics.doesExist = async function (email: string): Promise<boolean> {
	const user = await User.findOne({ email })

	return user ? true : false
}

/**
 * Hash a plain text password
 * @param password Password to hash
 * @returns The hashed password
 */
UserSchema.statics.hashPassword = async function (password: string): Promise<string> {
	// TODO: Put the salt round count in the config instead of hard coding it, so it is easy to change
	return await hash(password, 10)
}

/**
 * Check if a hashed password correspond to a plain text password
 * @param password Password to compare to the hash
 * @param hash Hash to compare to the password
 * @returns True if the password and the hash match, false otherwise
 */
UserSchema.statics.checkPassword = async function (password: string, hash: string): Promise<boolean> {
	return await compare(password, hash)
}

// ---- Model ----------------------------------------------------------------------------
export const User = model<IUserSchema, IUser>('User', UserSchema)
