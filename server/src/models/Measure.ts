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
	Ph = 'ph',
	Humidity = 'humidity',
	AirTemperature = 'air temperature',
	WaterTemperature = 'water temperature',
	ExternalAirHumidity = 'external air humidity',
	ExternalAirTemperature = 'external air temperature'
}

// ---- Schema interface -----------------------------------------------------------------
export interface IMeasureSchema extends Document {
	/** Sensor the recorded the measure */
	sensor: string
	/** Date and time of the measure record */
	captureDate: Date
	/** Value of the measure (unit not given) */
	value: number
}

// ---- Schema ---------------------------------------------------------------------------
export const MeasureSchema = new Schema<IMeasureSchema, Model<IMeasureSchema>>(
	{
		sensor: { type: String, required: true },
		captureDate: { type: Date, required: true },
		value: { type: Number, required: true }
	},
	{ collection: 'measures', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export interface IMeasure extends Model<IMeasureSchema> {
	// Statics

	/**
	 * Fetch the records from MyFood API
	 * @param greenhouseId The id of the greenhouse from the MyFood API
	 * @param maxRecords The maximum amount of records to keep (most recent first), -1 for all (default: -1)
	 * @returns The Measures from the fetched records
	 *
	 * ```typescript
	 * const greenhouseId = 91
	 * const records = await Measure.fetchMyFoodRecords(greenhouseId)
	 * ```
	 */
	fetchMyFoodRecords(greenhouseId: number, maxRecords?: number): Promise<IMeasureSchema[]>

	/**
	 * Fetch the records from MyFood API, but only returns the measures that are not registered in the database
	 * @param greenhouseId The id of the greenhouse from the MyFood API
	 * @param maxRecords The maximum amount of records to keep (most recent first), -1 for all (default: -1)
	 * @returns The filtered records
	 *
	 * ```typescript
	 * const greenhouseId = 91
	 * const newRecords = await Measure.fetchUnregisteredRecords(greenhouseId)
	 * // to get only the last entry for each sensor
	 * const newRecords = await Measure.fetchUnregisteredRecords(greenhouseId, 6)
	 * ```
	 */
	fetchUnregisteredRecords(greenhouseId: number, maxRecords?: number): Promise<IMeasureSchema[]>

	/**
	 * Filter all the given measures to keep only the ones the are not registered in the database
	 * @param records The measures to filter
	 * @returns The filtered measures
	 *
	 * ```typescript
	 * const records = await Measure.fetchMyFoodRecords(greenhouseId)
	 * const newRecords = await Measure.filterUnregisteredRecords(records)
	 * ```
	 */
	filterUnregisteredRecords(records: IMeasureSchema[]): Promise<IMeasureSchema[]>

	/**
	 * Get a sensor type by it's name
	 * @param sensorName Sensor name
	 * @returns Sensor type
	 *
	 * ```typescript
	 * const sensorName = record.sensor
	 * const sensor = Measure.getSensorByName(sensorName)
	 * ```
	 */
	getSensorByName(sensorName: string): Sensor
}

// ---- Statics --------------------------------------------------------------------------
/** Fetch the records from MyFood API */
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

/** Fetch the records from MyFood API, but only returns the measures that are not registered in the database */
MeasureSchema.statics.fetchUnregisteredRecords = async function (
	greenhouseId: number,
	maxRecords = -1
): Promise<IMeasureSchema[]> {
	const records = await Measure.fetchMyFoodRecords(greenhouseId, maxRecords)

	return await Measure.filterUnregisteredRecords(records)
}

/** Filter all the given measures to keep only the ones the are not registered in the database */
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

/** Get a sensor type by it's name */
MeasureSchema.statics.getSensorByName = function (sensorName: string): Sensor {
	switch (sensorName.toLowerCase()) {
		case 'ph sensor':
		case 'ph':
			return Sensor.Ph
		case 'water temperature sensor':
		case 'water temperature':
			return Sensor.WaterTemperature
		case 'air temperature sensor':
		case 'air temperature':
			return Sensor.AirTemperature
		case 'air humidity sensor':
		case 'air humidity':
		case 'humidity':
			return Sensor.Humidity
		case 'external air humidity sensor':
		case 'external air humidity':
			return Sensor.ExternalAirHumidity
		case 'external air temperature sensor':
		case 'external air temperature':
			return Sensor.ExternalAirTemperature
	}

	// By default, return the element for index 0
	return Sensor.Ph
}

// ---- Model ----------------------------------------------------------------------------
export const Measure = model<IMeasureSchema, IMeasure>('Measure', MeasureSchema)
