import config from './config'
import { Application } from './core/'
import { UserModule } from './modules'
import { FarmbotLogsModule } from './modules/FarmbotLogsModule'
import { MeasureModule } from './modules/MeasureModule'

// ---- App ------------------------------------------------------------------------------
const app = new Application({ ...config.app, ...{ db: config.db } })

// Register modules
app.registerModule(UserModule)
app.registerModule(MeasureModule)
app.registerModule(FarmbotLogsModule)

// Run the server
app.run()
