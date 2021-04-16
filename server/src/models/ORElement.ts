import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

// ---- Schema interface -----------------------------------------------------------------
export interface IORElementSchema extends Document {
	/** Value of the element (eg: "celery") */
	value: string | null
	/** Comment about the element (eg: "for Dôme association") */
	comment: string | null
}

// ---- Schema ---------------------------------------------------------------------------
export const ORElementSchema = new Schema<IORElementSchema, Model<IORElementSchema>>(
	{
		value: String,
		comment: String
	},
	{ collection: 'occupancy-rate-elements', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export type IORElement = Model<IORElementSchema>

// ---- Model ----------------------------------------------------------------------------
export const ORElement = model<IORElementSchema, IORElement>('OccupancyRateElement', ORElementSchema)
