import path from 'path'

import { defaultEnv, devProdEnv } from '.'

export default {
	greenhouseId: parseInt(defaultEnv('MYFOOD_GREENHOUSE_ID', '191'), 10),
	public: path.resolve(defaultEnv('PUBLIC_PATH', '../client/public')),
	port: parseInt(devProdEnv('PORT_DEV', 'PORT', '3000'), 10)
}
