import path from 'path'

import { defaultEnv, devProdEnv } from '.'

export default {
	public: path.resolve(defaultEnv('PUBLIC_PATH', '../client/public')),
	port: parseInt(devProdEnv('PORT_DEV', 'PORT', '3000'), 10)
}
