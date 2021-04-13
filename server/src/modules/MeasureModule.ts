import { Request, Response } from 'express'
import moment from 'moment'

import { Application, Module } from '../core'
import { IMeasureSchema, Measure, Sensor } from '../models/Measure'

// ---- Module ---------------------------------------------------------------------------
export class MeasureModule extends Module {
	constructor(app: Application) {
		super(app, 'MeasureModule')

		this.registerTask('0 */10 * * * *', this.updateMyFoodMeasures.bind(this))

		this.addEndpoints([
			{
				type: 'HTTP',
				method: 'GET',
				path: '/getMyFoodMeasures',
				handle: this.getMyFoodMeasuresHandler.bind(this)
			}
		])

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
	 * Handle /getMyFoodMeasures GET route: Get records stored in the database from my food API
	 *
	 * Query parameters:
	 * 	- since <timestamp> - UNIX timestamp of an UTC value that correspond to the minimum date of the measure
	 * 		eg: /getMyFoodMeasures?since=1618319759 (search for entries after date 2021-04-13T13:15:59.000Z)
	 *
	 * 	- until <timestamp> - UNIX timestamp of an UTC value that correspond to the maximum date of the measure
	 * 		eg: /getMyFoodMeasures?until=1618320417 (search for entries before date 2021-04-13T13:26:57.000Z)
	 * 			/getMyFoodMeasures?since=1618319759?until=1618320417 (search for entries between dates 2021-04-13T13:15:59.000Z and 2021-04-13T13:26:57.000Z)
	 *
	 *  - sensors <sensor1>,<sensor2>,... - List of sensors to get
	 * 		eg: /getMyFoodMeasures&sensors=ph,humidity (only get the ph and humidity sensors values)
	 * 		Response: [
	 *			{
	 *				"_id": "60759916f7603e3dcd86b779",
	 *				"captureDate": "2021-04-13T13:11:46.577Z",
	 *				"value": 33.6,
	 *				"sensor": "humidity",
	 *				"__v": 0
	 *			},
	 *			{
	 *				"_id": "60759916f7603e3dcd86b776",
	 *				"captureDate": "2021-04-13T13:11:46.577Z",
	 *				"value": 8.4,
	 *				"sensor": "ph",
	 *				"__v": 0
	 *			}
	 *		]
	 *
	 * 	- sort <[-]sort1>,<[-]sort2>,... - List of ordered fields to sort by (put a "-" before a field name to sort descending)
	 *		eg: /getMyFoodMeasures?sort=value (order results by value)
	 *		eg: /getMyFoodMeasures?sort=-sensor,value (order results by sensor name DESC and then by value ASC)
	 *
	 * 	- limit	<number> - Max number of results
	 * 		eg: /getMyFoodMeasures?limit=4 (will only return 4 maximum  results)
	 *
	 */
	public async getMyFoodMeasuresHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		try {
			// Measures minimum date, default: now - 20 minutes
			const since = query.since
				? moment
						.unix(parseInt(query.since as string, 10))
						.utc()
						.toDate()
				: moment.utc().add(-20, 'minutes').toDate()

			// Measures maximum date, default: now + 1 minute
			const until = query.until
				? moment
						.unix(parseInt(query.until as string, 10))
						.utc()
						.toDate()
				: moment.utc().add(1, 'minutes').toDate()

			// Measures sensor filter, default: all sensors
			const sensors: Sensor[] = query.sensors
				? (query.sensors as string).split(',').map((sensor) => Measure.getSensorByName(sensor))
				: [
						Sensor.Ph,
						Sensor.Humidity,
						Sensor.AirTemperature,
						Sensor.WaterTemperature,
						Sensor.ExternalAirHumidity,
						Sensor.ExternalAirTemperature
				  ]

			// Measures query sorter, default: captureDate DESC, sensor ASC
			const sort: any[] = query.sort
				? (query.sort as string).split(',').map((sorter: string) => {
						return sorter.charAt(0) === '-' ? { [sorter.substring(1)]: -1 } : { [sorter]: 1 }
				  })
				: [{ captureDate: -1 }, { sensor: 1 }]

			// Measures query limit (-1 all), default: sensors count
			const limit = query.limit ? parseInt(query.limit as string, 10) : sensors.length

			// Build the base query
			const measuresQuery = Measure.find({
				captureDate: {
					$gte: since,
					$lte: until
				},
				sensor: {
					$in: sensors
				}
			})

			// Apply sorts
			if (sort) sort.forEach((sorter) => measuresQuery.sort(sorter))

			// Apply limit
			if (limit > 0) measuresQuery.limit(limit)

			// Get the measures (execute the query)
			const measures = await measuresQuery

			// Check for valid mesures
			if (!measures || measures.length === 0) {
				// No mesures or empty array --> Error: No records
				res.json({
					error: 'No records',
					message: 'No measure found'
				})

				return res.end()
			}

			// Send the measures
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
