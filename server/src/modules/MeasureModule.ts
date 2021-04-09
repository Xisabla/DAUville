import axios from 'axios';
import { Request, Response } from 'express';
import moment from 'moment';
import { Application, Module } from '../core';
import { Measure, Sensor } from '../models/Measure'

interface ServerResponse {
    sensor: String,
    captureDate: Object,
    value: number
}

export class MeasureModule extends Module {

    constructor(app: Application) {
        super(app, 'MeasureModule')

        this.registerTask('0 */10 * * * *', this.getMyFoodMeasures.bind(this))

        this.addEndpoint({ type: 'HTTP', method: 'GET', path: '/myfoodmeasures', handle: this.getLastMeasuresHandler.bind(this) });
    }

    public async getMyFoodMeasures(): Promise<void> {
        return axios('https://hub.myfood.eu/opendata/productionunits/29/measures').then(response => {
            response.data.map(async function (e: ServerResponse, index: number) {
                if(index >= 6){
                    return Promise.resolve();
                }
                const measure = new Measure({
                    captureDate: moment(e.captureDate).toDate(),
                    value: e.value
                });
                switch(e.sensor){

                    case 'pH Sensor':
                        measure.sensor = Sensor.Ph;
                        break;
                    
                    case 'Water Temperature Sensor':
                        measure.sensor = Sensor.WaterTemperature;
                        break;

                    case 'Air Temperature Sensor':
                        measure.sensor = Sensor.AirTemperature;
                        break;

                    case 'Air Humidity Sensor':
                        measure.sensor = Sensor.Humidity;
                        break;
                    
                    case 'External Air Humidity':
                        measure.sensor = Sensor.ExternalAirHumidity;
                        break;

                    case 'External Air Temperature':
                        measure.sensor = Sensor.ExternalAirTemperature;
                        break;

                }
                return await measure.save();
            });
        });
    }

    public async getLastMeasuresHandler(req: Request, res: Response): Promise<void> {
        try{
            const tMin = moment().add(-10, 'minutes').toDate();
            const measures = await Measure.find({date: {$gte: tMin}});
            if (!measures || measures.length === 0){
                res.json({
                    error: 'No records',
                    message: 'Empty measures found'
                });

                return res.end();
            }

            res.json(measures.map(measure => measure.toJSON()))

            return res.end();

        }
        catch (e){
            res.json({
				error: 'Unexpected error',
				message: 'Something went wrong',
				details: e                
            });

            return res.end();
        }
    }
}