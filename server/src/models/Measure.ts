import axios from 'axios'
import debug from 'debug'
import moment from 'moment'
import { Document, Model, model, Schema } from 'mongoose'

const log = debug('model:Measure')

/**
 * Record from the MyFood API
 */
interface SensorRecord {
	sensor: string
	captureDate: string
	value: number
}

/**
 * Sensor that recorded the measure
 */
export const enum Sensor {
	Ph,
	Humidity,
	AirTemperature,
	WaterTemperature,
	ExternalAirHumidity,
	ExternalAirTemperature
}

// ---- Schema interface -----------------------------------------------------------------
export interface IMeasureSchema extends Document {
	/** Sensor the recorded the measure */
	sensor: number
	/** Date and time of the measure record */
	captureDate: Date
	/** Value of the measure (unit not given) */
	value: number
}

// ---- Schema ---------------------------------------------------------------------------
export const MeasureSchema = new Schema<IMeasureSchema, Model<IMeasureSchema>>(
	{
		sensor: { type: Number, required: true },
		captureDate: { type: Date, required: true },
		value: { type: Number, required: true }
	},
	{ collection: 'measures' }
)

// ---- Model Interface ------------------------------------------------------------------
export interface IMeasure extends Model<IMeasureSchema> {
	/** Fetch the records from MyFood API */
	fetchMyFoodRecords(greenhouseId: number, maxRecords?: number): Promise<IMeasureSchema[]>
	/** Fetch the records from MyFood API, but only returns the measures that are not registered in the database */
	fetchUnregisteredRecords(greenhouseId: number, maxRecords?: number): Promise<IMeasureSchema[]>
	/** Filter all the given measures to keep only the ones the are not registered in the database */
	filterUnregisteredRecords(records: IMeasureSchema[]): Promise<IMeasureSchema[]>
	/** Get a sensor type by it's name */
	getSensorByName(sensorName: string): Sensor
}

// ---- Statics --------------------------------------------------------------------------
/**
 * Fetch the records from MyFood API
 * @param greenhouseId The id of the greenhouse from the MyFood API
 * @param maxRecords The maximum amount of records to keep (most recent first), -1 for all (default: -1)
 * @returns The Measures from the fetched records
 */
MeasureSchema.statics.fetchMyFoodRecords = async function (
	greenhouseId: number,
	maxRecords?: number
): Promise<IMeasureSchema[]> {
	const url = `https://hub.myfood.eu/opendata/productionunits/${greenhouseId}/measures`

	log(`Fetching records from myfood API... (${url})`)

	const response = await axios(url)
	const records = response.data as Array<SensorRecord>

	log(`myfood API: Got ${records.length} records`)

	return (maxRecords !== -1 && maxRecords > 0 && maxRecords < records.length
		? records.slice(0, maxRecords)
		: records
	).map(
		(record) =>
			new Measure({
				captureDate: moment.utc(record.captureDate).toDate(),
				value: record.value,
				sensor: Measure.getSensorByName(record.sensor)
			})
	)
}

/**
 * Fetch the records from MyFood API, but only returns the measures that are not registered in the database
 * @param greenhouseId The id of the greenhouse from the MyFood API
 * @param maxRecords The maximum amount of records to keep (most recent first), -1 for all (default: -1)
 * @returns The filtered records
 */
MeasureSchema.statics.fetchUnregisteredRecords = async function (
	greenhouseId: number,
	maxRecords = -1
): Promise<IMeasureSchema[]> {
	const records = await Measure.fetchMyFoodRecords(greenhouseId, maxRecords)

	return await Measure.filterUnregisteredRecords(records)
}

/**
 * Filter all the given measures to keep only the ones the are not registered in the database
 * @param records The measures to filter
 * @returns The filtered measures
 */
MeasureSchema.statics.filterUnregisteredRecords = async function (
	records: IMeasureSchema[]
): Promise<IMeasureSchema[]> {
	log(`Filtering records from a set of ${records.length} records`)

	const filtered = (
		await Promise.all(
			records.map(async (record) => {
				const { captureDate, value, sensor } = record
				const same = await Measure.findOne({ captureDate, sensor, value })

				return same ? null : record
			})
		)
	).filter((record) => record)

	log(`Filtered ${filtered.length} new record(s)`)

	return filtered
}

/**
 * Get a sensor type by it's name
 * @param sensorName Sensor name
 * @returns Sensor type
 */
MeasureSchema.statics.getSensorByName = function (sensorName: string): Sensor {
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

// ---- Model ----------------------------------------------------------------------------
export const Measure = model<IMeasureSchema, IMeasure>('Measure', MeasureSchema)
