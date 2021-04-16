import { Request, Response } from 'express'
import moment from 'moment'

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

		const authorizationKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJ1bmtub3duIiwic3ViIjo4ODk5LCJpYXQiOjE2MTU5ODYxNTIsImp0aSI6IjY1YWI0ZDFhLTU4ZmQtNDQwZi05M2NmLTdjN2E1MjkwZWFkZCIsImlzcyI6Ii8vbXkuZmFybS5ib3Q6NDQzIiwiZXhwIjoxNjE5NDQyMTUyLCJtcXR0IjoiY2xldmVyLW9jdG9wdXMucm1xLmNsb3VkYW1xcC5jb20iLCJib3QiOiJkZXZpY2VfODkwOSIsInZob3N0IjoieGljb25mdW0iLCJtcXR0X3dzIjoid3NzOi8vY2xldmVyLW9jdG9wdXMucm1xLmNsb3VkYW1xcC5jb206NDQzL3dzL21xdHQifQ.ruNMUouHliZOIdY53zY7qo6ABb2c2EDeC_-dpxvVHEsw0CJu5ZbGcphLEExUBfOR4YJYgPeci8HO8wlKUHRgF7bLTHQ7Wqp1gPe_pofXG8G9ay-FRqolKLjgwHNJCUsdPP4FYl2_lboX64aD0nWB3QCU0fPd-RBonIWOPLib2DlzHowWvtMf0VmHljFwhR7Z6g0lAp2QBlhmZFPLLIQDicdzj9QFzcP8UFwabugMJhSMx8cDCMBK9o25ZBZB_g5pNF_yqjc9178Du4-FBDTm6oq-5u88pnJfpFuz1Ra0x4mLK4cLVz5cSUlI4JQ6RGn_DoTQzUidoZIy7Jp-1tfNpg' as string

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
