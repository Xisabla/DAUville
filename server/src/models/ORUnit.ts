import moment from 'moment'
import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

import { IORElementSchema, IORRateSchema, ORElement, ORElementSchema, ORRate, ORRateSchema } from './'

// ---- Schema interface -----------------------------------------------------------------
export interface IORUnitSchema extends Document {
	/** Name of the unit (eg: "cultivation cart") */
	name: string
	/** Number of slots available in the unit */
	slots: number
	/** Elements of the unit */
	elements: IORElementSchema[]
	/** History of occupation rate value */
	rates: IORRateSchema[]

	// Methods

	/**
	 * Compute the current occupancy rate of the unit
	 * @returns The occupancy rate entry
	 *
	 * ```typescript
	 * const module = new ORModule({ ... })
	 * const unit = module.units[0][0]
	 *
	 * const rate = unit.computeRate()
	 * ```
	 */
	computeRate(): IORRateSchema

	/**
	 * Fill the unit with empty elements
	 *
	 * ```typescript
	 * const module = new ORModule({ ... })
	 * const unit = module.units[0][0]
	 *
	 * await unit.fill()
	 * ```
	 */
	fill(): void

	/**
	 * Check if the units elements doesn't exceed the slot count
	 * @returns false if the count exceeds, false otherwise
	 *
	 * ```typescript
	 * const module = new ORModule({ ... })
	 *
	 * // Do changes on units
	 * ...
	 *
	 * // Make sur all units are valid
	 * for(groups in module.units) {
	 * 		for(unit in groups) {
	 * 			await group.validateSlots()
	 * 		}
	 * }
	 * ```
	 */
	validateSlots(): boolean
}

// ---- Schema ---------------------------------------------------------------------------
export const ORUnitSchema = new Schema<IORUnitSchema, Model<IORUnitSchema>>(
	{
		name: { type: String, required: true },
		slots: { type: Number, required: true },
		elements: [ORElementSchema],
		rates: [ORRateSchema]
	},
	{ collection: 'occupancy-rate-units', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export type IORUnit = Model<IORUnitSchema>

// ---- Methods --------------------------------------------------------------------------
/** Compute the current occupation rate and append it to the history */
ORUnitSchema.methods.computeRate = function (): IORRateSchema {
	const { slots, elements } = this
	let occupied = 0

	elements.forEach((element) => {
		if (element.value !== null) occupied++
	})

	const rate = occupied / slots
	const occupancyRate = new ORRate({ date: moment.utc().toDate, value: rate })

	this.rates.push(occupancyRate)

	return occupancyRate
}

/** Fill the unit with empty elements */
ORUnitSchema.methods.fill = function (): void {
	while (this.elements.length < this.slots) {
		this.elements.push(new ORElement({ value: null, comment: null }))
	}
}

/** Check if the units elements doesn't exceed the slot count */
ORUnitSchema.methods.validateSlots = function (): boolean {
	return this.elements.length <= this.slots
}

// ---- Model ----------------------------------------------------------------------------
export const ORUnit = model<IORUnitSchema, IORUnit>('OccupancyRateUnit', ORUnitSchema)
