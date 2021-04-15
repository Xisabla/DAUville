import moment from 'moment'
import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

// ---- Schema interface -----------------------------------------------------------------
export interface IORRateSchema extends Document {
	/** Time and date of  the rate computation */
	date: Date
	/** Value of the rate [0;1] */
	value: number
}

// ---- Schema ---------------------------------------------------------------------------
export const ORRateSchema = new Schema<IORRateSchema, Model<IORRateSchema>>(
	{
		date: { type: Date, required: true, default: () => moment.utc().toDate() },
		value: { type: Number, required: true }
	},
	{ collection: 'occupancy-rate-rates', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export type IORRate = Model<IORRateSchema>

// ---- Model ----------------------------------------------------------------------------
export const ORRate = model<IORRateSchema, IORRate>('OccupancyRateRate', ORRateSchema)
