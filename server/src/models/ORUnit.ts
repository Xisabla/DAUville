import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

import { IORElementSchema, ORElement, ORElementSchema } from './ORElement'

// ---- Schema interface -----------------------------------------------------------------
export interface IORUnitSchema extends Document {
	/** Name of the unit (eg: "cultivation cart") */
	name: string
	/** Number of slots available in the unit */
	slots: number
	/** Elements of the unit */
	elements: IORElementSchema[]

	// Methods
	/** Fill the unit with empty elements */
	fill(): void
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
 * Fill the unit with empty elements
 */
ORUnitSchema.methods.fill = function (): void {
	for (let i = 0; i < this.slots; i++) {
		this.elements.push(new ORElement({ value: null, comment: null }))
	}
}

/**
 * Check if the units elements doesn't exceed the slot count
 * @returns false if the count exceeds, false otherwise
 */
ORUnitSchema.methods.validateSlots = function (): boolean {
	return this.elements.length <= this.slots
}

// ---- Model ----------------------------------------------------------------------------
export const ORUnit = model<IORUnitSchema, IORUnit>('OccupancyRateUnit', ORUnitSchema)
