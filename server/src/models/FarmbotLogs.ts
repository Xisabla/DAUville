import axios from 'axios'
import moment from 'moment'
import { Document, Model, model, Schema } from 'mongoose'

/**
 * Sequence from the Farmbot API
 */
export interface SequenceInformation {
	name: string
}

/**
 * Record from the Farmbot API
 */
export interface LogsRecord {
	type: string
	message: string
	updated_at: string
}

// ---- Schema interface -----------------------------------------------------------------
export interface IFarmbotLogsSchema extends Document {
	/** Date of the record */
	date: Date
	/** Completed sequences of the day */
	completedSequences: Array<string>
	/** Uncompleted sequences of the day */
	uncompletedSequences: Array<string>
	/** Errors of the day */
	errorLogs: Array<LogsRecord>
}

// ---- Schema ---------------------------------------------------------------------------
export const FarmbotLogsSchema = new Schema<IFarmbotLogsSchema, Model<IFarmbotLogsSchema>>(
	{
		date: { type: Date, required: true },
		completedSequences: { type: Array, required: false },
		uncompletedSequences: { type: Array, required: false },
		errorLogs: { type: Array, required: false }
	},
	{ collection: 'farmbotlogs', timestamps: true }
)

// ---- Model Interface ------------------------------------------------------------------
export interface IFarmbotLogs extends Model<IFarmbotLogsSchema> {
	/** Fetch the farmbot logs and create a sumup entry */
	fetchFarmbotDailySumup(authorizationKey: string): Promise<IFarmbotLogsSchema>
	/** Fetch the sequences of the farmbot and get the completed one */
	fetchCompletedSequences(authorizationKey: string): Promise<string[]>
	/** Fetch the sequences of the farmbot and get the uncompleted one */
	fetchUncompletedSequences(authorizationKey: string): Promise<string[]>
	/** Fetch the logs of the farmbot from the API and get the errors */
	fetchErrors(authorizationKey: string): Promise<LogsRecord[]>
	/** Fetch the sequences of the farmbot */
	fetchFarmbotSequences(authorizationKey: string): Promise<string[]>
}

// ---- Statics --------------------------------------------------------------------------
/**
 * Fetch the farmbot logs and create a sumup entry
 * @param authorizationKey API Token key
 * @returns The sumup object created with the logs
 */
FarmbotLogsSchema.statics.fetchFarmbotDailySumup = async function (
	authorizationKey: string
): Promise<IFarmbotLogsSchema> {
	const completedSequences = await FarmbotLogs.fetchCompletedSequences(authorizationKey)
	const uncompletedSequences = await FarmbotLogs.fetchUncompletedSequences(authorizationKey)
	const errors = await FarmbotLogs.fetchErrors(authorizationKey)

	const sumup = new FarmbotLogs({
		date: moment.utc().toDate(),
		completedSequences: completedSequences,
		uncompletedSequences: uncompletedSequences,
		errorLogs: errors
	})

	return sumup
}

/**
 * Fetch the sequences of the farmbot and get the completed one
 * @param authorizationKey API Token key
 * @returns The completed sequences of the farmbot
 */
FarmbotLogsSchema.statics.fetchCompletedSequences = async function (authorizationKey: string): Promise<string[]> {
	const completedSequences = [] as Array<string>
	const url = 'https://my.farmbot.io/api/logs'

	const sequences = await FarmbotLogs.fetchFarmbotSequences(authorizationKey)
	const logs = await axios(url, { headers: { Authorization: authorizationKey } })

	// Map records to a better object [type, message, date]
	const botLogs: Array<Array<string>> = logs.data.map(function (log: LogsRecord) {
		if (log.updated_at.includes(moment.utc().format('YYYY-MM-DD'))) {
			return [log.type, log.message, log.updated_at]
		}
	})

	const startingSequenceIndexes: Array<Array<number>> = []
	const completedSequenceIndexes: Array<Array<number>> = []

	sequences.map(function (seq: string) {
		const startingForgedLog = ('Starting ' + seq) as string
		const completedForgedLog = ('Completed ' + seq) as string

		const curSequenceStartingIndexes: Array<number> = []
		const curSequenceCompletedIndexes: Array<number> = []

		let counter = 0

		botLogs.map(function (entry) {
			// Entry start the sequence
			if (entry[1].includes(startingForgedLog)) {
				curSequenceStartingIndexes.push(counter)
			}

			// Entry complete the sequence
			if (entry[1].includes(completedForgedLog)) {
				curSequenceCompletedIndexes.push(counter)
			}

			counter++
		})

		startingSequenceIndexes.push(curSequenceStartingIndexes)
		completedSequenceIndexes.push(curSequenceCompletedIndexes)
	})

	// Filter defined elements
	for (let i = 0; i < startingSequenceIndexes.length; i++) {
		for (let j = 0; j < startingSequenceIndexes[i].length; j++) {
			if (typeof completedSequenceIndexes[i][j] !== 'undefined') {
				completedSequences.push(sequences[i])
			}
		}
	}

	return completedSequences
}

/**
 * Fetch the sequences of the farmbot and get the uncompleted one
 * @param authorizationKey API Token key
 * @returns The uncompleted sequences of the farmbot
 */
FarmbotLogsSchema.statics.fetchUncompletedSequences = async function (authorizationKey: string): Promise<string[]> {
	const uncompletedSequences = [] as Array<string>
	const url = 'https://my.farmbot.io/api/logs'

	const sequences = await FarmbotLogs.fetchFarmbotSequences(authorizationKey)
	const logs = await axios(url, { headers: { Authorization: authorizationKey } })

	// Map records to a better object [type, message, date]
	const botLogs: Array<Array<string>> = logs.data.map(function (log: LogsRecord) {
		if (log.updated_at.includes(moment.utc().format('YYYY-MM-DD'))) {
			return [log.type, log.message, log.updated_at]
		}
	})

	const startingSequenceIndexes: Array<Array<number>> = []
	const completedSequenceIndexes: Array<Array<number>> = []

	sequences.map(function (e: string) {
		const startingForgedLog: string = 'Starting ' + e
		const completedForgedLog: string = 'Completed ' + e

		const curSequenceStartingIndexes: Array<number> = []
		const curSequenceCompletedIndexes: Array<number> = []

		let counter = 0

		botLogs.map(function (entry) {
			// Entry start the sequence
			if (entry[1].includes(startingForgedLog)) {
				curSequenceStartingIndexes.push(counter)
			}

			// Entry complete the sequence
			if (entry[1].includes(completedForgedLog)) {
				curSequenceCompletedIndexes.push(counter)
			}
			counter++
		})

		startingSequenceIndexes.push(curSequenceStartingIndexes)
		completedSequenceIndexes.push(curSequenceCompletedIndexes)
	})

	// Filter defined elements
	for (let i = 0; i < startingSequenceIndexes.length; i++) {
		for (let l = 0; l < startingSequenceIndexes[i].length; l++) {
			if (typeof completedSequenceIndexes[i][l] === 'undefined') {
				uncompletedSequences.push(sequences[i])
			}
		}
	}

	return uncompletedSequences
}

/**
 * Fetch the logs of the farmbot from the API and get the errors
 * @param authorizationKey API Token key
 * @returns The errors of the farmbot
 */
FarmbotLogsSchema.statics.fetchErrors = async function (authorizationKey: string): Promise<LogsRecord[]> {
	const url = 'https://my.farmbot.io/api/logs' as string
	const logs = await axios(url, { headers: { Authorization: authorizationKey } })

	const errors = logs.data.filter(function (log: LogsRecord) {
		if (log.type == 'error' && log.updated_at.includes(moment.utc().format('YYYY-MM-DD'))) {
			return log
		}
	})

	return errors
}

/**
 * Fetch the sequences of the farmbot
 * @param authorizationKey API Token key
 * @returns The sequences of the farmbot
 */
FarmbotLogsSchema.statics.fetchFarmbotSequences = async function (authorizationKey: string): Promise<string[]> {
	const url = 'https://my.farmbot.io/api/sequences'
	const response = await axios(url, { headers: { Authorization: authorizationKey } })
	const sequences = response.data.map((sequence: SequenceInformation) => sequence.name) as Array<string>

	return sequences
}

// ---- Model ----------------------------------------------------------------------------
export const FarmbotLogs = model<IFarmbotLogsSchema, IFarmbotLogs>('FarmbotLogs', FarmbotLogsSchema)
