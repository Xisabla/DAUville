import { Request, Response } from 'express'

import { Application, Module } from '../core'
import { ORModule } from '../models/ORModule'
import { ORUnit } from '../models/ORUnit'

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
			{ type: 'HTTP', method: 'POST', path: '/addOCUnit', handle: this.addUnitHandler.bind(this) }
		])

		/**
		 * Endpoints:
		 * (GET) 	- /getModule?name=<name>
		 * (POST)	- /addUnit?module=<name>&name=<unitName>&slots=<unitSlots>&group=[index] (if no index or index > length, new group)
		 * (POST)	- /addElement?module=<name>&group=<index>&unit=<unit>
		 *  ??					 ?unitId=<id>
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

			if (!module) {
				// No module found --> Error: No module found
				res.json({
					error: 'No module found',
					message: `No module with name "${moduleName}"`
				})

				return res.end()
			}

			if (groupIndex > 0 && groupIndex >= module.units.length) {
				// Out of range groupIndex --> Error: Group out of range
				res.json({
					error: 'Group out of range',
					message: `Group index ${groupIndex} is out of range (${module.units.length} groups for the module)`
				})

				return res.end()
			}

			const unit = new ORUnit({ name, slots })

			if (groupIndex > 0) module.units[groupIndex].push(unit)
			else module.units.push([unit])

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
