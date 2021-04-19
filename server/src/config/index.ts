import { config } from 'dotenv'

// Read .env file information
config()

// ---- Helpers --------------------------------------------------------------------------

/**
 * Check if a key is in the environment variables, then return its value, otherwise return the default value
 * @param envKey Key to check in the env variables
 * @param defaultValue Default value to return if the key is missing
 * @returns The value of env variable or the default value is the key is missing
 *
 * ```typescript
 * defaultEnv('MONGO_URL', 'mongodb+srv://localhost:27017')
 * // -> value of the env, if MONGO_URL is set to env, will return the
 * // -> 'mongodb+srv://localhost:27017', otherwise
 * ```
 */
export function defaultEnv(envKey: string, defaultValue: string): string {
	return Object.keys(process.env).includes(envKey) ? process.env[envKey] : defaultValue
}

/**
 * Same as defaultEnv but will check if the environment is dev or prod to use different keys
 * @param devKey Key to use while in development mode
 * @param prodKey Key to use while in production mode
 * @param defaultValue Default value to use if the key is missing
 * @returns The value of the env variables or the default value is the key is missing
 *
 * ```typescript
 * devProdEnv('PORT_DEV', 'PORT', '3000')
 * // -> value of the PORT_DEV env field, if the mode is development
 * // -> value of the PORT env field, if the mode is production
 * // -> '3000', if the env field is not defined
 * ```
 */
export function devProdEnv(devKey: string, prodKey: string, defaultValue: string): string {
	const key = process.env.NODE_ENV === 'development' ? devKey : prodKey

	return defaultEnv(key, defaultValue)
}

// ---- Config ---------------------------------------------------------------------------
import app from './application'
import db from './database'
import jwt from './farmbot'
import mail from './mail'
import security from './security'

export default {
	app,
	db,
	security,
	jwt,
	mail
}
