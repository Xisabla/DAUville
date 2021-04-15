import { model } from 'mongoose'
import { Document, Model, Schema } from 'mongoose'

import { IORRateSchema, IORUnitSchema, ORUnitSchema } from './'

// ---- Schema interface -----------------------------------------------------------------
export interface IORModuleSchema extends Document {
	/** Name of the modules */
	name: string
	/** Unit groups of the module */
	units: IORUnitSchema[][]

	// Methods
	/** Compute the current occupancy rate of each unit of each group */
	computeRates(): Promise<{ group: number; unit: number; rate: IORRateSchema }[]>
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

// ---- Methods --------------------------------------------------------------------------
/**
 * Compute the current occupancy rate of each unit of each group
 * @returns Each rate of each unit of each group as an array
 */
ORModuleSchema.methods.computeRates = async function (): Promise<{ unit: number; rate: IORRateSchema }[]> {
	const rates = []
	const groups = this.units

	for (let i = 0; i < groups.length; i++) {
		const group = groups[i]
		for (let j = 0; j < group.length; j++) {
			const unit = group[j]
			const rate = unit.computeRate()

			rates.push({ group: i, unit: j, rate })
		}
	}

	await this.save()

	return rates
}

// ---- Model ----------------------------------------------------------------------------
export const ORModule = model<IORModuleSchema, IORModule>('OccupancyRateModule', ORModuleSchema)
