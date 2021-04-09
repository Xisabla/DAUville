import mongoose, { Schema, Document, Model, model } from 'mongoose';

export const enum Sensor {
    Ph,
    Humidity,
    AirTemperature,
    WaterTemperature,
    ExternalAirHumidity,
    ExternalAirTemperature
}

export interface IMeasureSchema extends Document {
    sensor: number,
    captureDate: Date,
    value: number
}

export const MeasureSchema = new Schema<IMeasureSchema, Model<IMeasureSchema>>(
    {
        sensor: {type: Number, required: true},
        captureDate: {type: Date, required: true},
        value: {type: Number, required: true}
    }, 
    { collection: 'measures' }
)

export const Measure = model<IMeasureSchema>('Measure', MeasureSchema)