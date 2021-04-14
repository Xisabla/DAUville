import config from './config'
import { Application } from './core/'
import { MeasureModule, UserModule } from './modules'
import { OccupancyRateModule } from './modules/OccupancyRateModule'

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
app.registerModule(OccupancyRateModule)

// Run the server
app.run()
