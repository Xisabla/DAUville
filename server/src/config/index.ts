import { config } from 'dotenv'

// Read .env file information
config()

// ---- Helpers --------------------------------------------------------------------------

/**
 * Check if a key is in the environment variables, then return its value, otherwise return the default value
 * @param envKey Key to check in the env variables
 * @param defaultValue Default value to return if the key is missing
 * @returns The value of env variable or the default value is the key is missing
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
 */
export function devProdEnv(devKey: string, prodKey: string, defaultValue: string): string {
	const key = process.env.NODE_ENV === 'development' ? devKey : prodKey

	return defaultEnv(key, defaultValue)
}

// ---- Config ---------------------------------------------------------------------------
import app from './application'
import db from './database'
import jwt from './farmbot'
import security from './security'
import jwt from './farmbot'

export default {
	app,
	db,
	security,
	jwt
}
