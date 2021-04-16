import React, { Component } from 'react'

import rawMyfoodData from '../Myfood/measuresbrest.json'

export class Farmbot extends Component {
	render() {
		return rawMyfoodData.map((item) => {
			if (item.sensor == 'pH Sensor') {
				return <h1>{item.value}</h1>
			}
		})
	}
}
