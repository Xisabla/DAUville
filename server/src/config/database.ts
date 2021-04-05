import { defaultEnv } from '.'

export default {
	url: defaultEnv('MONGO_URL', 'mongodb+srv://localhost:27017'),
	user: defaultEnv('MONGO_USER', 'root'),
	pass: defaultEnv('MONGO_PASS', 'root'),
	dbname: defaultEnv('MONGO_DB', 'main')
}
