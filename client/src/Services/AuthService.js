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
