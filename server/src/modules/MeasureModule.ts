import { Request, Response } from 'express'
import moment from 'moment'

import { Application, Module } from '../core'
import { IMeasureSchema, Measure } from '../models/Measure'

// ---- Module ---------------------------------------------------------------------------
export class MeasureModule extends Module {
	constructor(app: Application) {
		super(app, 'MeasureModule')

		this.registerTask('0 */10 * * * *', this.updateMyFoodMeasures.bind(this))

		this.addEndpoint({
			type: 'HTTP',
			method: 'GET',
			path: '/getMyFoodMeasures',
			handle: this.getMyFoodMeasuresHandler.bind(this)
		})

		this.init()
	}

	/**
	 * Get all the reachable unregistered records from MyFood API and save them to the database
	 */
	private async init(): Promise<void> {
		this._log(`Initalizing module entries in the database...`)

		// NOTE: This is temporarily hardcoded, this value should be editable by an administrator user (or from a config file or whatever)
		// NOTE²: Serre ISA Lille: 29 - Serre de test (Brest): 191
		const greenhouseId = 191

		try {
			// Fetch records that are not already in the database
			const records = await Measure.fetchUnregisteredRecords(greenhouseId)

			// Save the records
			await Promise.all(records.map(async (measure) => await measure.save()))

			this._log(`Saved ${records.length} new record(s)`)
		} catch (error) {
			this._log(`An error happened while fetching MyFood API: ${error}`)
		}
	}

	/**
	 * Fetch the MyFood public API to get the latest sensor records, store them in the database, and notify the new values to the users through sockets
	 * @returns The new records
	 */
	public async updateMyFoodMeasures(): Promise<IMeasureSchema[]> {
		// NOTE: This is temporarily hardcoded, this value should be editable by an administrator user (or from a config file or whatever)
		// NOTE²: Serre ISA Lille: 29 - Serre de test (Brest): 191
		const greenhouseId = 191

		this._log('Updating myfood measures')

		try {
			// Fetch the last 6 records that are not already in the database (6 records because there are 6 sensors)
			const records = await Measure.fetchUnregisteredRecords(greenhouseId, 6)

			this._log(`Got ${records.length}, sending to sockets`)

			// Save the records
			const measures = await Promise.all(records.map(async (record) => await record.save()))

			// Send the records to the users through sockets
			this._sockets.forEach((socket) => {
				socket.emit('updateMyFoodMeasures', { measures: measures.map((measure) => measure.toJSON()) })
			})

			return measures
		} catch (error) {
			this._log(`An error happened while updating MyFood measures: ${error}`)
		}
	}

	/**
	 * Handle /getMyFoodMeasures GET route: Get the last records stored from my food API
	 */
	public async getMyFoodMeasuresHandler(req: Request, res: Response): Promise<void> {
		try {
			// Get latest mesures (from now - 10 minutes)
			const minimumDate = moment.utc().add(-10, 'minutes').toDate()
			const measures = await Measure.find({ captureDate: { $gte: minimumDate } }).sort({ sensor: 1 })

			// Check for valid mesures
			if (!measures || measures.length === 0) {
				// No mesures or empty array --> Error: No records
				res.json({
					error: 'No records',
					message: 'No measure found'
				})

				return res.end()
			}

			res.json(measures.map((measure) => measure.toJSON()))

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}
}
