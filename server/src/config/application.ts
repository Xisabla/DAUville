import path from 'path'

import { defaultEnv, devProdEnv } from '.'

export default {
	public: path.resolve(defaultEnv('PUBLIC', '../client/public')),
	port: parseInt(devProdEnv('PORT_DEV', 'PORT', '3000'), 10)
}
