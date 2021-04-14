import { Request, Response } from 'express'

import { Application, Module } from '../core'
import { ORModule } from '../models/ORModule'
import { IORUnitSchema, ORUnit } from '../models/ORUnit'

// ---- Module ---------------------------------------------------------------------------
export class OccupancyRateModule extends Module {
	// ---- Basics -----------------------------------------------------------------------

	/**
	 * Allow the client to get the occupancy rates data and add/edit them
	 * @param app Application
	 */
	constructor(app: Application) {
		super(app, 'OccupancyRateModule')

		this.addEndpoints([
			{ type: 'HTTP', method: 'GET', path: '/getOCModule', handle: this.getModuleHandler.bind(this) },
			{ type: 'HTTP', method: 'GET', path: '/getOCModules', handle: this.getModulesHandler.bind(this) },
			{ type: 'HTTP', method: 'POST', path: '/addOCUnit', handle: this.addUnitHandler.bind(this) },
			{ type: 'HTTP', method: 'PUT', path: '/moveOCUnit', handle: this.moveUnitHandler.bind(this) },
			{ type: 'HTTP', method: 'PUT', path: '/changeOCUnitSlots', handle: this.changeUnitSlotsHandler.bind(this) }
		])

		/**
		 * Endpoints:
		 * (GET) 	- /getModule?name=<name>
		 * (POST)	- /addUnit?module=<name>&name=<unitName>&slots=<unitSlots>&group=[index] (if no index or index > length, new group)
		 * (PUT) 	- /moveUnit?module=<name>&group=<index>&unit=<index>&toGroup=<groupIndex>
		 * (PUT) 	- /changeUnitSlots?module=<name>&group=<index>&unit=<index>&slots=<slots>
		 * (DELETE)	- /removeUnit?module=<name>&group=<index>&unit=<index>
		 * (PUT) 	- /editElement?module=<name>&group=<index>&unit=<index>&element=<index>&value=[value]&comment=[comment]
		 */
	}

	/**
	 * Ensure that the needed modules exist in the database
	 */
	protected async init(): Promise<void> {
		this._log('Initalizing occupancy rate modules entries in the database...')

		try {
			// NOTE: This is temporarily hardcoded, this value should be editable by an administrator user (or from a config file or whatever)
			// ORModules that have to be in the database
			const modules = ['Aquaponic greenhouse', 'Cultivation carts', 'Farmbot']

			await Promise.all(
				modules.map(async (name) => (await ORModule.findOne({ name })) ?? (await new ORModule({ name }).save()))
			)

			this._log('Occupancy rate module entries initializing done')
		} catch (error) {
			this._log(`An error happened while initializing the occupancy rate modules in the database: ${error}`)
		}
	}

	// ---- Routes -----------------------------------------------------------------------

	/**
	 * Handle /getOCModules GET route: Get all the modules occupancy rate information
	 */
	public async getModulesHandler(req: Request, res: Response): Promise<void> {
		try {
			const modules = await ORModule.find()

			res.json({ modules: modules.map((module) => module.toJSON()) })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/**
	 * Handle /getOCModule GET route: Get the occupancy rate information of a given module
	 */
	public async getModuleHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}
		const name = query.name as string

		// Check for valid parameters
		if (!name) {
			// No name --> Error: Missing arguments
			res.json({
				error: 'Missing arguments',
				message: 'Missing one or many of the following parameters: name'
			})

			return res.end()
		}

		try {
			const module = await ORModule.findOne({ name })

			// Check if the module if found
			if (!module) {
				// No module found --> Error: No module found
				res.json({
					error: 'No module found',
					message: `No module with name "${name}"`
				})

				return res.end()
			}

			res.json({ module: module.toJSON() })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/**
	 * Handle /addOCUnit POST route: Add a unit (name + slots) to a given module
	 */
	public async addUnitHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		const moduleName = query.module as string
		const name = query.name as string
		const slots = query.slots as string
		const groupIndex = parseInt(query.group as string, 10) ?? -1

		// Check for valid parameters
		if (!moduleName || !name || !slots) {
			// No module --> Error: Missing arguments
			res.json({
				error: 'Missing arguments',
				message: 'Missing one or many of the following parameters: module, name, slots, group (facultative)'
			})

			return res.end()
		}

		try {
			const module = await ORModule.findOne({ name: moduleName })

			// Check if the module if found
			if (!module) {
				// No module found --> Error: No module found
				res.json({
					error: 'No module found',
					message: `No module with name "${moduleName}"`
				})

				return res.end()
			}

			// Check if the group index is valid
			if (groupIndex > 0 && groupIndex >= module.units.length) {
				// Out of range groupIndex --> Error: Group out of range
				res.json({
					error: 'Group out of range',
					message: `Group index ${groupIndex} is out of range (${module.units.length} groups for the module)`
				})

				return res.end()
			}

			// Create and fill the unit
			const unit = new ORUnit({ name, slots })
			unit.fill()

			// Append the unit to the group
			if (groupIndex > 0) module.units[groupIndex].push(unit)
			else module.units.push([unit])

			// Save the module
			await module.save()

			res.json({ message: 'success', module: module.toJSON() })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/**
	 * Handle /moveOCUnit PUT route: Move a unit from a group to another
	 */
	public async moveUnitHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		const moduleName = query.module as string
		const group = query.group as string
		const unit = query.unit as string
		const to = query.to as string

		// Check for valid parameters
		if (!moduleName || !group || !unit || !to) {
			// No module --> Error: Missing arguments
			res.json({
				error: 'Missing arguments',
				message: 'Missing one or many of the following parameters: module, group, unit, to'
			})

			return res.end()
		}

		try {
			const module = await ORModule.findOne({ name: moduleName })

			// Check if the module is found
			if (!module) {
				// No module found --> Error: No module found
				res.json({
					error: 'No module found',
					message: `No module with name "${moduleName}"`
				})

				return res.end()
			}

			const groupId = parseInt(group, 10)
			const toId = parseInt(to, 10)
			const unitId = parseInt(unit, 10)

			// Check for valid groupId
			if (groupId >= module.units.length) {
				// Out of range groupId --> Error: Source group out of range
				res.json({
					error: 'Source group out of range',
					message: `Group index ${groupId} is out of range (${module.units.length} groups for the module)`
				})

				return res.end()
			}

			// Check for valid unitId
			if (unitId >= module.units[groupId].length) {
				// Out of range unit --> Error: Unit out of range
				res.json({
					error: 'Unit out of range',
					message: `Group index ${groupId} has only ${module.units[groupId].length} units, you are trying to get out of range unit id ${unitId}`
				})

				return res.end()
			}

			// Check for valid toId
			if (toId > module.units.length) {
				// Out of range toId --> Error: Destination group out of range
				res.json({
					error: 'Destination group out of range',
					message: `Group index ${toId} is out of range (${module.units.length} groups for the module)`
				})

				return res.end()
			}

			// Move the unit
			module.units[toId].push(module.units[groupId][unitId])
			module.units[groupId].splice(unitId, 1)

			// Save the document
			await module.save()

			res.json({ message: 'success', module: module.toJSON() })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/**
	 * Handle /changeOCUnitSlots PUT route: Change the number of slots of a unit
	 */
	public async changeUnitSlotsHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		const moduleName = query.module as string
		const group = query.group as string
		const unit = query.unit as string
		const slots = query.slots as string

		// Check for valid parameters
		if (!moduleName || !group || !unit || !slots) {
			// No module --> Error: Missing arguments
			res.json({
				error: 'Missing arguments',
				message: 'Missing one or many of the following parameters: module, group, unit, slots'
			})

			return res.end()
		}

		try {
			const module = await ORModule.findOne({ name: moduleName })

			// Check if the module is found
			if (!module) {
				// No module found --> Error: No module found
				res.json({
					error: 'No module found',
					message: `No module with name "${moduleName}"`
				})

				return res.end()
			}

			const groupId = parseInt(group, 10)
			const unitId = parseInt(unit, 10)
			const slotCount = parseInt(slots, 10)

			// Check for valid groupId
			if (groupId >= module.units.length) {
				// Out of range groupId --> Error: Group out of range
				res.json({
					error: 'Group out of range',
					message: `Group index ${groupId} is out of range (${module.units.length} groups for the module)`
				})

				return res.end()
			}

			// Check for valid unitId
			if (unitId >= module.units[groupId].length) {
				// Out of range unit --> Error: Unit out of range
				res.json({
					error: 'Unit out of range',
					message: `Group index ${groupId} has only ${module.units[groupId].length} units, you are trying to get out of range unit id ${unitId}`
				})

				return res.end()
			}

			// Check for valid slotCount
			const notNullElements = module.units[groupId][unitId].elements.filter((element) => element.value != null)
			if (notNullElements.length > slotCount) {
				// Not enough slots --> Error: Not enough slots for the current elements
				res.json({
					error: 'Not enough slots for the current elements',
					message: `There are ${notNullElements.length} non empty elements, please remove their value before removing slots`
				})

				return res.end()
			}

			// Change slots
			module.units[groupId][unitId].slots = slotCount
			module.units[groupId][unitId].elements = notNullElements
			module.units[groupId][unitId].fill()

			// Save the document
			await module.save()

			res.json({ message: 'success', module: module.toJSON() })

			return res.end()
		} catch (error) {
			// Error caught --> Something went wrong
			res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: error
			})

			return res.end()
		}
	}

	/*public async removeUnitHandler(req: Request, res: Response): Promise<void> {}

	public async editElementHandler(req: Request, res: Response): Promise<void> {}*/
}
