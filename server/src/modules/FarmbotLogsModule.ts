import { Request, Response } from 'express'
import moment from 'moment'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import nodemailer from 'nodemailer'

import config from '../config'
import { Application, Module } from '../core'
import { FarmbotLogs, LogsRecord } from '../models'

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

		// JWT to connect to the farmbot api
		const authorizationKey = config.jwt.token as string

		// Mail service credentials
		const mailUser = config.mail.user
		const mailPass = config.mail.pass

		try {
			// Fetch the farmbot logs and store them to sum up
			const sumup = await FarmbotLogs.fetchFarmbotDailySumup(authorizationKey)

			// Save the sumup
			await sumup.save()

			//---------------------------------------------------------------------------------------------------------------
			// 											DAILY SUM UP MAIL DELIVERY
			//---------------------------------------------------------------------------------------------------------------

			// Creating the beginning of the mailString with the current date in format YYYY-MM-DD
			const mailBeginningString =
				'Greetings, here is the ' + moment.utc().format('YYYY-MM-DD').toString() + ' FarmBot report.<br><br>'

			// Creating the part containing all the completed sequences
			const completedSequencesString =
				'<dl><dt>Completed sequences :</dt>' +
				sumup
					.get('completedSequences')
					.map(function (e: string) {
						return '<dd> -' + e + '</dd>'
					})
					.join('') +
				'<br><br>'

			// Creating the part containing all the uncompleted sequences
			const uncompletedSequencesString =
				'<dt>Uncompleted sequences : </dt>' +
				sumup
					.get('uncompletedSequences')
					.map(function (e: string) {
						return '<dd> -' + e + '</dd>'
					})
					.join('') +
				'<br><br>'

			// Creating the part containing all the errors
			const errorsString =
				'<dt>Errors reported today : </dt>' +
				sumup
					.get('errorLogs')
					.map((e: LogsRecord) => '<dd>' + e.updated_at + ' --- ' + e.message + '</dd>')
					.join('<br><br>') +
				'</dl>'

			// Merging all the parts in a String
			const mailString =
				mailBeginningString + completedSequencesString + uncompletedSequencesString + errorsString

			// Connect to the SMTP service
			const transporter = nodemailer.createTransport({
				host: 'smtp.office365.com',
				port: 587,
				secure: false,
				auth: {
					user: mailUser,
					pass: mailPass
				}
			})

			// Send the mail containing the mailString to a given address
			transporter.sendMail(
				{
					from: mailUser,
					to: 'brandon.oneill@student.junia.com', // Recipient input can be a list of addresses each separated by a comma
					cc: 'audrey.michenaud-rague@junia.com,benjamin.legrand@junia.com',
					subject: moment.utc().format('YYYY-MM-DD') + ' FarmBot Report',
					html: mailString
				},
				function (err, info) {
					if (err) {
						this._log(err)
					} else {
						this._log('Email sent: ' + info.response)
					}
				}
			)
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
