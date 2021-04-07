import config from './config'
import { Application } from './core/'
import { UserModule } from './modules'

// ---- App ------------------------------------------------------------------------------
const app = new Application({ ...config.app, ...{ db: config.db } })

// Register modules
app.registerModule(UserModule)

// Run the server
app.run()
