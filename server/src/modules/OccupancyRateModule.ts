import { Request, Response } from 'express'

import { Application, Module } from '../core'
import { IORModuleSchema, ORElement, ORModule, ORUnit } from '../models'

// ---- Module ---------------------------------------------------------------------------
export class OccupancyRateModule extends Module {
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
			{ type: 'HTTP', method: 'PUT', path: '/changeOCUnitSlots', handle: this.changeUnitSlotsHandler.bind(this) },
			{ type: 'HTTP', method: 'DELETE', path: '/removeOCUnit', handle: this.removeUnitHandler.bind(this) },
			{ type: 'HTTP', method: 'PUT', path: '/editOCElement', handle: this.editElementHandler.bind(this) }
		])

		this.registerTask('0 0 * * * *', this.updateOccupancyRates.bind(this))
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

	// ---- Tasks ------------------------------------------------------------------------

	/**
	 * Compute the occupancy rate of all the modules and update them
	 * @returns All the modules
	 */
	public async updateOccupancyRates(): Promise<IORModuleSchema[]> {
		this._log('Updating occupancy rates of modules')

		try {
			const modules = await ORModule.find()

			await Promise.all(
				modules.map(async (module) => {
					await module.computeRates()
				})
			)

			return modules
		} catch (error) {
			this._log('An error occurred while updating the modules occupancy rates')
		}
	}

	// ---- Routes -----------------------------------------------------------------------

	/**
	 * Handle /getOCModules GET route: Get all the modules occupancy rate information
	 *
	 * Query parameters: none
	 *
	 * Response: { modules: ORModuleSchema[] }
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
	 *
	 * Query parameters:
	 * 	- name <module> (mandatory) - Name of the module
	 * 		eg: /getOCModule?name=Aquaponic%20greenhouse
	 *
	 * Response: { module: ORModuleSchema }
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
	 *
	 * Query parameters:
	 * 	- module <module> (mandatory) - Name of the module
	 * 		eg: /addOCUnit?name=Aquaponic%20greenhouse
	 *
	 * 	- name <unit> (mandatory) - Name of the unit
	 * 		eg: /addOCUnit?name=Aquaponic%20greenhouse&name=Plantation%20tower
	 *
	 * - slots <number> (mandatory) - Number of slots of the unit
	 * 		eg: /addOCUnit?name=Aquaponic%20greenhouse&name=Plantation%20tower&slots=6
	 *
	 * - groupIndex <group> (facultative) - Group of the unit, starts at 0 (-1 means new group)
	 * 		eg: /addOCUnit?name=Aquaponic%20greenhouse&name=Plantation%20tower&slots=6&groupIndex=2
	 * 			/addOCUnit?name=Aquaponic%20greenhouse&name=Plantation%20tower&slots=6&groupIndex=-1
	 *
	 * Response: { message: 'success', module: ORModuleSchema }
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
	 *
	 * Query parameters:
	 * 	- module <module> (mandatory) - Name of the module
	 * 		eg: /moveOCUnit?name=Aquaponic%20greenhouse
	 *
	 * 	- group <group> (mandatory) - Group of the unit inside the module
	 * 		eg: /moveOCUnit?name=Aquaponic%20greenhouse&group=2
	 *
	 * 	- unit <unit> (mandatory) - Index of the unit inside the group
	 * 		eg: /moveOCUnit?name=Aquaponic%20greenhouse&group=2&unit=6
	 *
	 * 	- to <group> (mandatory) - Index of the new group of the unit
	 * 		eg: /moveOCUnit?name=Aquaponic%20greenhouse&group=2&unit=6&to=0
	 *
	 * Response: { message: 'success', module: ORModuleSchema }
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
	 *
	 * Query parameters:
	 * 	- module <module> (mandatory) - Name of the module
	 * 		eg: /changeOCUnitSlots?name=Aquaponic%20greenhouse
	 *
	 * 	- group <group> (mandatory) - Group of the unit inside the module
	 * 		eg: /changeOCUnitSlots?name=Aquaponic%20greenhouse&group=2
	 *
	 * 	- unit <unit> (mandatory) - Index of the unit inside the group
	 * 		eg: /changeOCUnitSlots?name=Aquaponic%20greenhouse&group=2&unit=6
	 *
	 * 	- slots <slots> (mandatory) - New slot count of the unit
	 * 		eg: /changeOCUnitSlots?name=Aquaponic%20greenhouse&group=2&unit=6&slots=12
	 *
	 * Response: { message: 'success', module: ORModuleSchema }
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

	/**
	 * Handle /removeOCUnit DELETE route: Remove a unit if there are only empty elements inside
	 *
	 * Query parameters:
	 * 	- module <module> (mandatory) - Name of the module
	 * 		eg: /removeOCUnit?name=Aquaponic%20greenhouse
	 *
	 * 	- group <group> (mandatory) - Group of the unit inside the module
	 * 		eg: /removeOCUnit?name=Aquaponic%20greenhouse&group=2
	 *
	 * 	- unit <unit> (mandatory) - Index of the unit inside the group
	 * 		eg: /removeOCUnit?name=Aquaponic%20greenhouse&group=2&unit=6
	 *
	 * Response: { message: 'success', module: ORModuleSchema }
	 */
	public async removeUnitHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		const moduleName = query.module as string
		const group = query.group as string
		const unit = query.unit as string

		// Check for valid parameters
		if (!moduleName || !group || !unit) {
			// No module --> Error: Missing arguments
			res.json({
				error: 'Missing arguments',
				message: 'Missing one or many of the following parameters: module, group, unit'
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
			if (notNullElements.length > 0) {
				// Some elements are not null --> Error: No empty elements remaining
				res.json({
					error: 'No empty elements remaining',
					message: `There are ${notNullElements.length} non empty elements, please remove their value before removing the unit`
				})

				return res.end()
			}

			// Remove the unit
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
	 * Handle /editOCElement PUT route: Edit the content or the comment of and element
	 *
	 * Query parameters:
	 * 	- module <module> (mandatory) - Name of the module
	 * 		eg: /editOCElement?name=Aquaponic%20greenhouse
	 *
	 * 	- group <group> (mandatory) - Group of the unit inside the module
	 * 		eg: /editOCElement?name=Aquaponic%20greenhouse&group=2
	 *
	 * 	- unit <unit> (mandatory) - Index of the unit inside the group
	 * 		eg: /editOCElement?name=Aquaponic%20greenhouse&group=2&unit=6
	 *
	 * 	- element <element> (mandatory) - Index of the element inside the unit
	 * 		eg: /editOCElement?name=Aquaponic%20greenhouse&group=2&unit=6&element=3
	 *
	 * 	- value <value> (facultative) - New value of the element
	 * 		eg: /editOCElement?name=Aquaponic%20greenhouse&group=2&unit=6&element=3&value=strawberry
	 *
	 * 	- comment <value> (facultative) - New comment of the element
	 * 		eg: /editOCElement?name=Aquaponic%20greenhouse&group=2&unit=6&element=3&value=strawberry&comment=Comment%20example%20here
	 *
	 * Response: { message: 'success', module: ORModuleSchema }
	 */
	public async editElementHandler(req: Request, res: Response): Promise<void> {
		const query = req?.query ?? {}

		const moduleName = query.module as string
		const group = query.group as string
		const unit = query.unit as string
		const element = query.element as string
		const value = query.value as string
		const comment = query.comment as string

		// Check for valid parameters
		if (!moduleName || !group || !unit) {
			// No module --> Error: Missing arguments
			res.json({
				error: 'Missing arguments',
				message: 'Missing one or many of the following parameters: module, group, unit'
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
			const elementId = parseInt(element, 10)

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

			// Check for valid elementId
			if (elementId >= module.units[groupId][unitId].elements.length) {
				// Out of range element --> Error: Unit out of range
				res.json({
					error: 'Unit out of range',
					message: `Unit has only ${module.units[groupId][unitId].elements.length} elements, you are trying to get out of range element id ${elementId}`
				})

				return res.end()
			}

			// Edit the element
			module.units[groupId][unitId].elements[elementId] = new ORElement({
				value: value && value !== '' ? value : null,
				comment: comment && comment !== '' ? comment : null
			})

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
}
