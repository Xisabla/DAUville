import { faTemperatureLow } from '@fortawesome/free-solid-svg-icons'
import { ContentCopy, Warning } from 'material-ui-icons'
import React, { Component } from 'react'
import ReactApexChart from 'react-apexcharts'
import ChartistGraph from 'react-chartist'

import { CounterWidget, StatsCard } from '../'

export class CultivationCarts extends Component {
	render() {
		const data = {
			labels: ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'],
			series: [[1, 2, 3, 4, 5, 6, 7, 8]]
		}

		const dataTempAir = {
			labels: ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'],
			series: [[15, 16, 17, 20, 22, 24, 7, 8]]
		}

		/*let dataEclairage = {
			labels: ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'],
			series: [[7, 8, 11, 5, 12, 4, 7, 1]]
		}*/

		const state = {
			series: [
				{
					name: 'Air temperature',
					data: [4, 3, 10, 9, 29, 19, 22, 9, 12, 7, 19, 5, 13, 9, 17, 2, 7, 5]
				}
			],
			options: {
				chart: {
					height: 350,
					type: 'line'
				},
				stroke: {
					width: 7,
					curve: 'smooth'
				},
				xaxis: {
					type: 'datetime',
					categories: [
						'1/11/2000',
						'2/11/2000',
						'3/11/2000',
						'4/11/2000',
						'5/11/2000',
						'6/11/2000',
						'7/11/2000',
						'8/11/2000',
						'9/11/2000',
						'10/11/2000',
						'11/11/2000',
						'12/11/2000',
						'1/11/2001',
						'2/11/2001',
						'3/11/2001',
						'4/11/2001',
						'5/11/2001',
						'6/11/2001'
					],
					tickAmount: 10,
					labels: {
						formatter: function (value, timestamp, opts) {
							return opts.dateFormatter(new Date(timestamp), 'dd MMM')
						}
					}
				},
				title: {
					text: 'Air temperature',
					align: 'left',
					style: {
						fontSize: '16px',
						color: '#666'
					}
				},
				fill: {
					type: 'gradient',
					gradient: {
						shade: 'dark',
						gradientToColors: ['#FDD835'],
						shadeIntensity: 1,
						type: 'horizontal',
						opacityFrom: 1,
						opacityTo: 1,
						stops: [0, 100, 100, 100]
					}
				},
				markers: {
					size: 4,
					colors: ['#FFA41B'],
					strokeColors: '#fff',
					strokeWidth: 2,
					hover: {
						size: 7
					}
				},
				yaxis: {
					min: -10,
					max: 40,
					title: {
						text: 'Temperature'
					}
				}
			}
		}
		const lightingData = {
			series: [
				{
					name: '',
					data: [44, 55, 41, 67, 22, 43, 21, 33, 45, 31, 87, 65, 35]
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
					categories: [
						'day1',
						'day2',
						'day3',
						'day4',
						'day5',
						'day6',
						'day7',
						'day8',
						'day9',
						'day10',
						'day11',
						'day12',
						'day13'
					],
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
							<div className="card">
								<div className="card-header ">
									<h4 className="card-title">Eclairage</h4>
								</div>
								<div className="card-body">
									<ChartistGraph data={data} type="Bar" />
									<hr />
									<div className="stats">
										<i className="fa fa-clock-o"></i> Data sent 1 week ago
									</div>
								</div>
							</div>
							<ReactApexChart options={state.options} series={state.series} type="line" height={350} />
							<StatsCard
								icon={ContentCopy}
								title="CAMERA STATUS"
								description="On"
								statIcon={Warning}
								statIconColor="blue"
								statLink={{ text: 'Get More Space...', href: '#pablo' }}
							/>
						</div>
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="card-header">
										<h4 className="card-title">Température Air</h4>
									</div>
									<ChartistGraph data={dataTempAir} type="Line" />
									<hr />
									<div className="stats">
										<i className="fa fa-clock-o"></i> Data sent 1 week ago
									</div>
								</div>
							</div>

							<CounterWidget
								category="Temperature"
								period="Feb 1 - Apr 1"
								percentage={18.2}
								content="28"
								icon={faTemperatureLow}
								iconColor="shape-secondary"
							/>
						</div>
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="card-header">
										<h4 className="card-title">Eclairage</h4>
									</div>
									<ReactApexChart
										options={lightingData.options}
										series={lightingData.series}
										type="bar"
										height={350}
									/>
									<hr />
									<div className="stats">
										<i className="fa fa-clock-o"></i> Data sent 1 week ago
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}
