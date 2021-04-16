import { Request, Response } from 'express'
import moment from 'moment'

import config from '../config'
import { Application, Module } from '../core'
import { FarmbotLogs } from '../models/FarmbotLogs'

export class FarmbotLogsModule extends Module {
	constructor(app: Application) {
		super(app, 'FarmbotLogsModule')

		this.registerTask('0 0 18 * * *', this.updateFarmbotDailySumUp.bind(this))

		this.addEndpoints([
			{
				type: 'HTTP',
				method: 'GET',
				path: '/getFarmbotDailySumUp',
				handle: this.getFarmbotDailySumUpHandler.bind(this)
			}
		])
	}

	private async updateFarmbotDailySumUp(): Promise<void> {
		this._log('Adding Farmbot daily sum up...')

		const authorizationKey = config.jwt.token as string

		try {
			const sumup = await FarmbotLogs.fetchFarmbotDailySumup(authorizationKey)

			await sumup.save()
		} catch (error) {
			this._log(`An error happened while fetching Farmbot API: ${error}`)
		}
	}

	private async getFarmbotDailySumUpHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		try {
			const since = query.since
				? moment
						.unix(parseInt(query.since as string, 10))
						.utc()
						.toDate()
				: moment.utc().add(-30, 'days').toDate()

			const until = query.until
				? moment
						.unix(parseInt(query.until as string, 10))
						.utc()
						.toDate()
				: moment.utc().add(1, 'minutes').toDate()

			const farmbotQuery = FarmbotLogs.find({
				date: {
					$gte: since,
					$lte: until
				}
			})

			const farmbot = await farmbotQuery

			if (!farmbot || farmbot.length === 0) {
				res.json({
					error: 'No records',
					message: 'No sum up found'
				})

				return res.end()
			}

			res.json(farmbot.map((farmbot) => farmbot.toJSON()))

			return res.end()
		} catch (error) {
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}
}
