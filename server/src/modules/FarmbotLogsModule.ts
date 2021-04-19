import { Request, Response } from 'express'
import moment from 'moment'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import nodemailer from 'nodemailer'

import config from '../config'
import { Application, Module } from '../core'
import { FarmbotLogs } from '../models'

// ---- Module ---------------------------------------------------------------------------
export class FarmbotLogsModule extends Module {
	/**
	 * Allow farmbot daily logs sumup fetching
	 * @param app Application
	 */
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

	// ---- Tasks ------------------------------------------------------------------------

	/**
	 * Fetch the farmbot logs from the API and store the sumup to the database
	 */
	private async updateFarmbotDailySumUp(): Promise<void> {
		this._log('Adding Farmbot daily sum up...')

		const authorizationKey = config.jwt.token as string

		// const mailUser = config.mail.user
		// const mailPass = config.mail.pass

		try {
			// Fetch the farmbot logs and store them to sum up
			const sumup = await FarmbotLogs.fetchFarmbotDailySumup(authorizationKey)

			// Sum the sumup
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

	// ---- Routes -----------------------------------------------------------------------

	/**
	 * Handle /getFarmbotDailySumUp GET route: Get the farmbot records stored in the database from the farmbot API
	 *
	 * Query:
	 * 	- since <timestamp> (facultative) - UNIX timestamp of an UTC value that correspond to the minimum date of the sumup
	 * 		eg: /getFarmbotDailySumUp?since=1618319759 (search for entries after date 2021-04-13T13:15:59.000Z)
	 *
	 * 	- until <timestamp> (facultative) - UNIX timestamp of an UTC value that correspond to the maximum date of the sumup
	 * 		eg: /getFarmbotDailySumUp?until=1618320417 (search for entries before date 2021-04-13T13:26:57.000Z)
	 * 		eg: /getFarmbotDailySumUp?since=1618319759&until=1618320417 (search for entries between dates 2021-04-13T13:15:59.000Z and 2021-04-13T13:26:57.000Z)
	 *
	 * Response: FarmbotLogsSchema[]
	 *
	 * ```typescript
	 * // Client
	 * const sumups = fetch('/getFarmbotDailySumUp').then((res) => res.json())
	 *
	 * if(sumups.error) {
	 * 		// Handle error
	 * 		...
	 * } else {
	 * 		const todaySumup = sumups[sumups.length - 1]
	 * 		console.log(todaySumup) // { date: ..., completedSequences: [ ... ], uncompletedSequences: [ ... ], errorLogs: [ ... ] }
	 * }
	 * ```
	 */
	private async getFarmbotDailySumUpHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		try {
			// Sumups minimum date, default: now - 30 days
			const since = query.since
				? moment
						.unix(parseInt(query.since as string, 10))
						.utc()
						.toDate()
				: moment.utc().add(-30, 'days').toDate()

			// Sumups maximum date, default: now + 1 minute
			const until = query.until
				? moment
						.unix(parseInt(query.until as string, 10))
						.utc()
						.toDate()
				: moment.utc().add(1, 'minutes').toDate()

			// Fetch the sumups
			const sumupsQuery = FarmbotLogs.find({
				date: {
					$gte: since,
					$lte: until
				}
			})

			const sumups = await sumupsQuery

			// Check for valid sumups
			if (!sumups || sumups.length === 0) {
				// No sumups or empty array --> Error: No records
				res.status(400)
				res.json({
					error: 'No records',
					message: 'No sum up found'
				})

				return res.end()
			}

			// Send the sumups
			res.status(200)
			res.json(sumups.map((farmbot) => farmbot.toJSON()))

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.status(500)
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}
}
