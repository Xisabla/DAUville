import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

import { IORUnitSchema, ORUnitSchema } from './ORUnit'

// ---- Schema interface -----------------------------------------------------------------
export interface IORModuleSchema extends Document {
	name: string
	units: IORUnitSchema[][]
}

// ---- Schema ---------------------------------------------------------------------------
export const ORModuleSchema = new Schema<IORModuleSchema, Model<IORModuleSchema>>(
	{
		name: { type: String, required: true, unique: true },
		units: [[ORUnitSchema]]
	},
	{ collection: 'occupancy-rate-modules', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export type IORModule = Model<IORModuleSchema>

// ---- Model ----------------------------------------------------------------------------
export const ORModule = model<IORModuleSchema, IORModule>('OccupancyRateModule', ORModuleSchema)
