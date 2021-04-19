import debug from 'debug'
import { Request, Response } from 'express'
import moment from 'moment'
import nodemailer from 'nodemailer'

import config from '../config'
import { Application, Module } from '../core'
import { FarmbotLogs, IFarmbotLogs, IFarmbotSchema, LogsRecord } from '../models/FarmbotLogs'

const log = debug('modules:FarmbotLogsModule')

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

		// const mailUser = config.mail.user
		// const mailPass = config.mail.pass

		try {
			const sumup = await FarmbotLogs.fetchFarmbotDailySumup(authorizationKey)

			await sumup.save()

			//---------------------------------------------------------------------------------------------------------------
			// 											DAILY SUM UP MAIL DELIVERY
			//---------------------------------------------------------------------------------------------------------------

			// Because the IT support does not want to provide us an email address for the project, the following section is 
			// commented. Feel free to uncomment it as soon as you get an email address.

			//---------------------------------------------------------------------------------------------------------------
			// const mailBeginningString =
			// 	'Greetings, here is the ' + moment.utc().format('YYYY-MM-DD').toString() + ' FarmBot report. \n\n'
			// const completedSequencesString = 'Completed sequences : \n' + sumup.get('completedSequences') + '\n\n'
			// const uncompletedSequencesString = 'Uncompleted sequences : \n' + sumup.get('uncompletedSequences') + '\n\n'
			// const errorsString =
			// 	'These errors happened this day : \n' +
			// 	sumup.get('errorLogs').map((e: LogsRecord) => e.message + ' -- ' + e.updated_at + '\n')

			// const mailString =
			// 	mailBeginningString + completedSequencesString + uncompletedSequencesString + errorsString

			// const transporter = nodemailer.createTransport({
			// 	host: 'smtp.office365.com',
			// 	port: 587,
			// 	secure: false,
			// 	auth: {
			// 		user: mailUser,
			// 		pass: mailPass
			// 	}
			// })

			// transporter.sendMail(
			// 	{
			// 		from: mailUser,
			// 		to: [mail recipients],
			// 		subject: moment.utc().format('YYYY-MM-DD') + ' FarmBot Report',
			// 		text: mailString
			// 	},
			// 	function (err, info) {
			// 		if (err) {
			// 			log(err)
			// 		} else {
			// 			log('Email sent: ' + info.response)
			// 		}
			// 	}
			// )
			//---------------------------------------------------------------------------------------------------------------

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
