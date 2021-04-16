import { CronJob } from 'cron'
import debug, { Debugger } from 'debug'
import moment, { Moment } from 'moment'

import { Module } from './'

export type TaskAction = (task: Task) => Promise<any>
export type TaskSchedule = string | Moment | Date

/**
 * Description of a Task
 */
export interface TaskOptions {
	/** Module of the task, null or empty if orphan */
	origin?: Module
	/** The moment when the task should trigger (moment, date, cron schedule) */
	schedule: TaskSchedule
	/** Action to perform when the task job is triggered */
	action: TaskAction
	/** Does the task auto start ? (means enable but not triggered at instantiation) (default: false) */
	start?: boolean
}

export class Task {
	/** Task ID */
	protected readonly _id: number
	/** Task origin object */
	protected readonly _origin: Module | null
	/** Task logger */
	protected readonly _log: Debugger

	/** Inter job that will trigger the action (actual task) */
	protected _job: CronJob
	/** Action to run on job triggered */
	protected readonly _action: TaskAction
	/** Last task run */
	protected _lastCall: Moment | null

	/** ID counter */
	private static _counter = 0
	/** Task pool */
	private static _pool: Task[] = []

	/**
	 * Cron task handled by Modules
	 * @param task Description of the task
	 */
	constructor(task: TaskOptions) {
		this._id = Task._counter++

		const { origin, schedule, action, start } = task
		// Set logger
		this._log = debug(`task:#${this._id}(${origin ? origin.name : 'orphan'})`)

		// Set origin
		this._action = action
		this._origin = origin
		this._job = new CronJob(schedule, () => this.run())

		// Auto start
		if (start) this.start()

		// Add task to pool
		Task._pool.push(this)
	}

	// ---- External control -----------------------------------------------------------------

	/**
	 * Enable the task
	 */
	public start(): void {
		this._job.start()
		this._log(`Job started, next call: ${this.nextCall}`)
	}

	/**
	 * Disable the task
	 */
	public stop(): void {
		this._job.stop()
		this._log('Job stopped')
	}

	// ---- Action ---------------------------------------------------------------------------

	/**
	 * Run the task action
	 * @returns The return of the task action
	 */
	private async run(): Promise<any> {
		this._lastCall = moment()
		this._log('Performing action')

		const values = await this._action(this)

		this._log(`Action performed, next call: ${this.nextCall}`)

		return values
	}

	// ---- Getters --------------------------------------------------------------------------

	get id(): number {
		return this._id
	}

	get origin(): Module | null {
		return this._origin
	}

	get lastCall(): Moment {
		return this._lastCall
	}

	get nextCall(): Moment {
		return this._job.nextDate()
	}

	get running(): boolean {
		return this._job.running
	}

	// ---- Static getters (pool) ------------------------------------------------------------

	/**
	 * Get all tasks from the same origin
	 * @param origin Origin of the tasks, null or 'Orphan' for orphan tasks
	 * @returns The list of the tasks
	 */
	public static from(origin: Module | string | null): Task[] {
		return Task._pool.filter(
			(task) =>
				((!origin || (typeof origin === 'string' && origin.toLowerCase() === 'orphan')) && !task.origin) ||
				(origin &&
					task.origin &&
					((origin instanceof Module && task.origin.name === origin.name) || task.origin.name === origin))
		)
	}

	public static get count(): number {
		return Task._pool.length
	}

	public static get tasks(): Task[] {
		return Task._pool
	}

	public static get runningTasks(): Task[] {
		return Task._pool.filter((task) => task.running)
	}

	public static get stoppedTasks(): Task[] {
		return Task._pool.filter((task) => !task.running)
	}
}
