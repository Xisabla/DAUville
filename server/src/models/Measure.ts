import { Document, Model, model, Schema } from 'mongoose'

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
export type IMeasure = Model<IMeasureSchema>

// ---- Model ----------------------------------------------------------------------------
export const Measure = model<IMeasureSchema, IMeasure>('Measure', MeasureSchema)
