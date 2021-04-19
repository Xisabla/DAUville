import axios from 'axios'
import moment from 'moment'
import { Document, Model, model, Schema } from 'mongoose'

export interface SequenceInformation {
	name: string
}

export interface LogsRecord {
	type: string
	message: string
	updated_at: string
}

export interface IFarmbotSchema extends Document {
	date: Date
	completedSequences: Array<string>
	uncompletedSequences: Array<string>
	errorLogs: Array<LogsRecord>
}

export const FarmbotSchema = new Schema<IFarmbotSchema, Model<IFarmbotSchema>>(
	{
		date: { type: Date, required: true },
		completedSequences: { type: Array, required: false },
		uncompletedSequences: { type: Array, required: false },
		errorLogs: { type: Array, required: false }
	},
	{ collection: 'farmbotlogs' }
)

export interface IFarmbotLogs extends Model<IFarmbotSchema> {
	fetchFarmbotDailySumup(authorizationKey: string): Promise<IFarmbotSchema>
	fetchCompletedSequences(authorizationKey: string): Promise<string[]>
	fetchUncompletedSequences(authorizationKey: string): Promise<string[]>
	fetchErrors(authorizationKey: string): Promise<LogsRecord[]>
	fetchFarmbotSequences(authorizationKey: string): Promise<string[]>
}

FarmbotSchema.statics.fetchFarmbotDailySumup = async function (authorizationKey: string): Promise<IFarmbotSchema> {
	const curCompletedSequences = await FarmbotLogs.fetchCompletedSequences(authorizationKey)

	const curUncompletedSequences = await FarmbotLogs.fetchUncompletedSequences(authorizationKey)

	const errors = await FarmbotLogs.fetchErrors(authorizationKey)

	const result = new FarmbotLogs({
		date: moment.utc().toDate(),
		completedSequences: curCompletedSequences,
		uncompletedSequences: curUncompletedSequences,
		errorLogs: errors
	})

	return result
}

FarmbotSchema.statics.fetchCompletedSequences = async function (authorizationKey: string): Promise<string[]> {
	const completedSequences = [] as Array<string>

	const url = 'https://my.farmbot.io/api/logs'

	const sequences = await FarmbotLogs.fetchFarmbotSequences(authorizationKey)

	const resp = await axios(url, { headers: { Authorization: authorizationKey } })

	const botLogs: Array<Array<string>> = resp.data.map(function (e: LogsRecord) {
		if (e.updated_at.includes(moment.utc().format('YYYY-MM-DD'))) {
			return [e.type, e.message, e.updated_at]
		}
	})

	const startingSequenceIndexes: Array<Array<number>> = []
	const completedSequenceIndexes: Array<Array<number>> = []

	sequences.map(function (e: string) {
		const startingForgedLog = ('Starting ' + e) as string
		const completedForgedLog = ('Completed ' + e) as string

		const curSequenceStartingIndexes: Array<number> = []
		const curSequenceCompletedIndexes: Array<number> = []

		let counter = 0

		botLogs.map(function (a) {
			if (a[1].includes(startingForgedLog)) {
				curSequenceStartingIndexes.push(counter)
			}

			if (a[1].includes(completedForgedLog)) {
				curSequenceCompletedIndexes.push(counter)
			}
			counter++
		})

		startingSequenceIndexes.push(curSequenceStartingIndexes)

		completedSequenceIndexes.push(curSequenceCompletedIndexes)
	})

	for (let i = 0; i < startingSequenceIndexes.length; i++) {
		for (let l = 0; l < startingSequenceIndexes[i].length; l++) {
			if (typeof completedSequenceIndexes[i][l] !== 'undefined') {
				completedSequences.push(sequences[i])
			}
		}
	}

	return completedSequences
}

FarmbotSchema.statics.fetchUncompletedSequences = async function (authorizationKey: string): Promise<string[]> {
	const uncompletedSequences = [] as Array<string>

	const url = 'https://my.farmbot.io/api/logs'

	const sequences = await FarmbotLogs.fetchFarmbotSequences(authorizationKey)

	const resp = await axios(url, { headers: { Authorization: authorizationKey } })

	const botLogs: Array<Array<string>> = resp.data.map(function (e: LogsRecord) {
		if (e.updated_at.includes(moment.utc().format('YYYY-MM-DD'))) {
			return [e.type, e.message, e.updated_at]
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

		botLogs.map(function (a) {
			if (a[1].includes(startingForgedLog)) {
				curSequenceStartingIndexes.push(counter)
			}

			if (a[1].includes(completedForgedLog)) {
				curSequenceCompletedIndexes.push(counter)
			}
			counter++
		})

		startingSequenceIndexes.push(curSequenceStartingIndexes)

		completedSequenceIndexes.push(curSequenceCompletedIndexes)
	})

	for (let i = 0; i < startingSequenceIndexes.length; i++) {
		for (let l = 0; l < startingSequenceIndexes[i].length; l++) {
			if (typeof completedSequenceIndexes[i][l] === 'undefined') {
				uncompletedSequences.push(sequences[i])
			}
		}
	}

	return uncompletedSequences
}

FarmbotSchema.statics.fetchErrors = async function (authorizationKey: string): Promise<LogsRecord[]> {
	const url = 'https://my.farmbot.io/api/logs' as string

	const response = await axios(url, { headers: { Authorization: authorizationKey } })

	const errorsArray = response.data.filter(function (a: LogsRecord) {
		if (a.type == 'error' && a.updated_at.includes(moment.utc().format('YYYY-MM-DD'))) {
			return a
		}
	})

	return errorsArray
}

FarmbotSchema.statics.fetchFarmbotSequences = async function (authorizationKey: string): Promise<string[]> {
	const url = 'https://my.farmbot.io/api/sequences'

	const response = await axios(url, { headers: { Authorization: authorizationKey } })

	const sequenceArray = response.data.map((e: SequenceInformation) => e.name) as Array<string>

	return sequenceArray
}

export const FarmbotLogs = model<IFarmbotSchema, IFarmbotLogs>('FarmbotLogs', FarmbotSchema)
