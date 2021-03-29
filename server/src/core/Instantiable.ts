/* eslint-disable @typescript-eslint/ban-types */

/**
 * Abstract class interface
 * @see https://github.com/microsoft/TypeScript/issues/17572#issuecomment-319994873
 */
export type Abstract<T> = Function & { prototype: T }

/**
 * Usual class interface
 * @see https://github.com/microsoft/TypeScript/issues/17572#issuecomment-319994873
 */
export type Constructor<T> = new (...args: any[]) => T

/**
 * Complete class interface
 * @see https://github.com/microsoft/TypeScript/issues/17572#issuecomment-319994873
 */
export type Class<T> = Abstract<T> | Constructor<T>
