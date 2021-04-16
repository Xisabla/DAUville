import { ContentCopy, Warning } from 'material-ui-icons'
import moment from 'moment'
import React, { Component } from 'react'
import ReactApexChart from 'react-apexcharts'
import ChartistGraph from 'react-chartist'

import { StatsCard } from '../'
import rawMyfoodData from './measuresbrest.json'

// ---- Helper methods -------------------------------------------------------------------
function filterMeasureData(rawData, sensorName) {
	return rawData
		.filter((measure) => measure.sensor === sensorName)
		.map((measure) => measure.value)
		.filter((value) => value)
}

function mean(numbers) {
	return numbers.reduce((a, b) => a + b, 0) / numbers.length ?? 0
}

// ---- Data -----------------------------------------------------------------------------
const dates = rawMyfoodData
	.filter((measure) => measure.sensor === 'Water Temperature Sensor')
	.map((measure) => measure.captureDate)
	.filter((date) => date)
	.map((date) => moment.utc(date).toDate())

const phMeasures = filterMeasureData(rawMyfoodData, 'pH Sensor')
const waterTemperatureMeasures = filterMeasureData(rawMyfoodData, 'Water Temperature Sensor').reverse()
const airTemperatureMeasures = filterMeasureData(rawMyfoodData, 'Air Temperature Sensor').reverse()
const externalAirTemperatureMeasures = filterMeasureData(rawMyfoodData, 'External Air Temperature').reverse()
const externalAirHumidityMeasures = filterMeasureData(rawMyfoodData, 'External Air Humidity').reverse()
const airHumidityMeasures = filterMeasureData(rawMyfoodData, 'Air Humidity Sensor')

// ---- Component ------------------------------------------------------------------------
export class Myfood extends Component {
	render() {
		let waterGraphData = {
			labels: dates,
			series: [waterTemperatureMeasures]
		}

		const state = {
			series: [
				{
					name: 'Air Humidity Sensor',
					data: airHumidityMeasures
				},
				{
					name: 'External Air Humidity',
					data: externalAirHumidityMeasures
				}
			],
			options: {
				chart: {
					height: 350,
					type: 'area'
				},
				dataLabels: {
					enabled: false
				},
				stroke: {
					curve: 'smooth'
				},
				xaxis: {
					labels: {
						rotate: -45
					},
					categories: dates.sort(),
					tickPlacement: 'on'
				},
				tooltip: {
					x: {
						format: 'dd/MM/yy HH:mm'
					}
				}
			}
		}

		const airTemperatureData = {
			series: [
				{
					name: 'Air Temperature',
					data: airTemperatureMeasures
				},
				{
					name: 'External Air Temperature',
					data: externalAirTemperatureMeasures
				}
			],
			options: {
				annotations: {
					points: [
						{
							x: 'day1',
							seriesIndex: 0,
							label: {
								borderColor: '#775DD0',
								offsetY: 0,
								style: {
									color: '#fff',
									background: '#775DD0'
								}
							}
						}
					]
				},
				chart: {
					height: 350,
					type: 'bar'
				},
				plotOptions: {
					bar: {
						borderRadius: 10,
						columnWidth: '50%'
					}
				},
				dataLabels: {
					enabled: false
				},
				stroke: {
					width: 2
				},

				grid: {
					row: {
						colors: ['#fff', '#f2f2f2']
					}
				},
				xaxis: {
					labels: {
						rotate: -45
					},
					categories: dates.sort(),
					tickPlacement: 'on'
				},
				yaxis: {
					title: {
						text: ''
					}
				},
				fill: {
					type: 'gradient',
					gradient: {
						shade: 'light',
						type: 'horizontal',
						shadeIntensity: 0.25,
						gradientToColors: undefined,
						inverseColors: true,
						opacityFrom: 0.85,
						opacityTo: 0.85,
						stops: [50, 0, 100]
					}
				}
			}
		}

		return (
			<div className="content">
				<div className="container-fluid">
					<div className="row">
						<div className="col-md-4">
							<div className="testt">
								<div className="testt-body">
									<div className="testt-header">
										<h4 className="testt-title">Water Temperature</h4>
									</div>
									<ChartistGraph data={waterGraphData} type="Line" />
									<hr />
								</div>
							</div>
							<div className="testt">
								<div className="testt-body">
									<div className="testt-header">
										<h4 className="testt-title">Air Temperature / External Air temperature</h4>
									</div>
									<ReactApexChart
										options={airTemperatureData.options}
										series={airTemperatureData.series}
										type="bar"
										height={350}
									/>
									<hr />
								</div>
							</div>
							<div className="testt">
								<div className="testt-body">
									<div className="testt-header">
										<h4 className="testt-title">Air Humidity / External Air Humidity</h4>
									</div>
									<ReactApexChart
										options={state.options}
										series={state.series}
										type="area"
										height={350}
									/>
								</div>
							</div>
							<StatsCard
								icon={ContentCopy}
								title="Mean pH Value"
								description={mean(phMeasures).toFixed(2)}
								statIcon={Warning}
								statIconColor="blue"
								statLink={{ text: 'Get More Space...', href: '#pablo' }}
							/>
						</div>
					</div>
				</div>
			</div>
		)
	}
}
