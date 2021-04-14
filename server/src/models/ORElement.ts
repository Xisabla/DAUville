import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

// ---- Schema interface -----------------------------------------------------------------
export interface IORElementSchema extends Document {
	/** Value of the element (eg: "celery") */
	value: string
	/** Comment about the element (eg: "for Dôme association") */
	comment: string
}

// ---- Schema ---------------------------------------------------------------------------
export const ORElementSchema = new Schema<IORElementSchema, Model<IORElementSchema>>(
	{
		value: { type: String, required: true },
		comment: String
	},
	{ collection: 'occupancy-rate-elements', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export type IORElement = Model<IORElementSchema>

// ---- Model ----------------------------------------------------------------------------
export const ORElement = model<IORElementSchema, IORElement>('OccupancyRateElement', ORElementSchema)
