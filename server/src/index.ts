import config from './config'
import { Application } from './core'
import { FarmbotLogsModule, MeasureModule, OccupancyRateModule, UserModule } from './modules'

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
app.registerModule(FarmbotLogsModule)
app.registerModule(OccupancyRateModule)

// Run the server
app.run()
