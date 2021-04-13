import config from './config'
import { Application } from './core/'
import { MeasureModule, UserModule } from './modules'

// ---- Package exports ------------------------------------------------------------------
export * from './config'
export * from './core'
export * from './models'
export * from './modules'

// ---- App ------------------------------------------------------------------------------
const app = new Application({ ...config.app, ...{ db: config.db } })

// Register modules
app.registerModule(UserModule)
app.registerModule(MeasureModule)

// Run the server
app.run()
