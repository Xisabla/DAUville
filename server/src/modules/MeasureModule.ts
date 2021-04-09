import axios from 'axios'
import { Request, Response } from 'express'
import moment from 'moment'

import { Application, Module } from '../core'
import { IMeasureSchema, Measure, Sensor } from '../models/Measure'

// ---- Interfaces -----------------------------------------------------------------------
interface SensorRecord {
	sensor: string
	captureDate: string
	value: number
}

// ---- Module ---------------------------------------------------------------------------
export class MeasureModule extends Module {
	constructor(app: Application) {
		super(app, 'MeasureModule')

		this.registerTask('0 */10 * * * *', this.updateMyFoodRecords.bind(this))

		this.addEndpoint({
			type: 'HTTP',
			method: 'GET',
			path: '/getMyFoodMeasures',
			handle: this.getMyFoodMeasuresHandler.bind(this)
		})

		// Get current last values at initialization to ensure that the database is not empty when the server starts
		this.updateMyFoodRecords()
	}

	/**
	 * Get the sensor type by it's name
	 * @param sensorName Sensor name
	 * @returns Sensor type
	 */
	private getSensorByName(sensorName: string): Sensor {
		switch (sensorName) {
			case 'pH Sensor':
				return Sensor.Ph
			case 'Water Temperature Sensor':
				return Sensor.WaterTemperature
			case 'Air Temperature Sensor':
				return Sensor.AirTemperature
			case 'Air Humidity Sensor':
				return Sensor.Humidity
			case 'External Air Humidity':
				return Sensor.ExternalAirHumidity
			case 'External Air Temperature':
				return Sensor.ExternalAirTemperature
		}

		// By default, return the element for index 0
		return Sensor.Ph
	}

	/**
	 * Fetch the MyFood public API to get the latest sensor records, store them in the database, and notify the new values to the users through sockets
	 * @returns The new records
	 */
	public async updateMyFoodRecords(): Promise<IMeasureSchema[]> {
		const response = await axios('https://hub.myfood.eu/opendata/productionunits/29/measures')
		const records = response.data as Array<SensorRecord>

		// Get the 6 first elements to get the last records (6 = number of different sensors)
		const measures = records.slice(0, 6).map(
			(measure) =>
				new Measure({
					captureDate: moment(measure.captureDate).toDate(),
					value: measure.value,
					sensor: this.getSensorByName(measure.sensor)
				})
		)

		// Filter to get only measures that are not already in the database
		// Filters with async methods need a small trick "Promise.all", "map" and "filter": https://stackoverflow.com/a/46842181
		const unregisteredMeasures = (
			await Promise.all(
				measures.map(async (measure) => {
					const { captureDate, value, sensor } = measure
					const same = await Measure.findOne({ captureDate, sensor, value })

					return same ? null : measure
				})
			)
		).filter((measure) => measure)

		// TODO: Notify sockets with all measures instead of stopping here
		return Promise.all(unregisteredMeasures.map(async (measure) => await measure.save()))
	}

	/**
	 * Handle /getMyFoodMeasures GET route: Get the last records stored from my food API
	 */
	public async getMyFoodMeasuresHandler(req: Request, res: Response): Promise<void> {
		try {
			// Get latest mesures (from now - 10 minutes)
			const minimumDate = moment().add(-10, 'minutes').toDate()
			const measures = await Measure.find({ date: { $gte: minimumDate } })

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
