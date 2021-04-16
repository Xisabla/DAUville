/**
 * Attempt to call the API to login with the given credentials
 * @param {String} email The email of the account
 * @param {String} password The password of the account
 * @returns A promise with the user object or an error
 */
export function login(email, password) {
	return fetch(`/login?email=${email}&password=${password}`, { method: 'POST' })
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				return Promise.reject(data)
			} else {
				const user = data.user

				localStorage.setItem('token', user.token)
				// Note: necessary ?
				localStorage.setItem('user', JSON.stringify(user))

				return user
			}
		})
}

/**
 * Attempt to c all the API to register a new account with the given credentials
 * @param {String} email The email address of the account to create
 * @param {String} password The password of the account to create
 * @param {String | null} token The token of the admin user the is creating the count (if not set, will be fetched in the "localStorage")
 * @returns A promise with the user object or an error
 */
export function register(email, password, token) {
	if (!token || token == null || token === '') token = localStorage.getItem('token')

	return fetch(`/register?email=${email}&password=${password}&token=${token}`, { method: 'POST' })
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				return Promise.reject(data)
			} else {
				const user = data.user

				return user
			}
		})
}
