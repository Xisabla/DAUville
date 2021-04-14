import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

import { IORElementSchema, ORElementSchema } from './ORElement'

// ---- Schema interface -----------------------------------------------------------------
export interface IORUnitSchema extends Document {
	/** Name of the unit (eg: "cultivation cart") */
	name: string
	/** Number of slots available in the unit */
	slots: number
	/** Elements of the unit */
	elements: IORElementSchema[]

	// Methods
	/** Check if the units elements doesn't exceed the slot count */
	validateSlots(): boolean
}

// ---- Schema ---------------------------------------------------------------------------
export const ORUnitSchema = new Schema<IORUnitSchema, Model<IORUnitSchema>>(
	{
		name: { type: String, required: true },
		slots: { type: Number, required: true },
		elements: [ORElementSchema]
	},
	{ collection: 'occupancy-rate-units', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export type IORUnit = Model<IORUnitSchema>

// ---- Methods --------------------------------------------------------------------------
/**
 * Check if the units elements doesn't exceed the slot count
 * @returns false if the count exceeds, false otherwise
 */
ORUnitSchema.methods.validateSlots = function (): boolean {
	return this.elements.length <= this.slots
}

// ---- Model ----------------------------------------------------------------------------
export const ORUnit = model<IORUnitSchema, IORUnit>('OccupancyRateUnit', ORUnitSchema)
