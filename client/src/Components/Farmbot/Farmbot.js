import React, { Component } from 'react'
import { JsonToTable } from 'react-json-to-table'
/**
 * Component that shows the main values of the farmbot information
 */

export class Farmbot extends Component {
	constructor(props) {
		super(props)

		this.state = {
			items: [],
			isLoaded: false
		}
	}

	componentDidMount() {
		fetch('/getFarmbotDailySumUp')
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					console.log('An error has occurred while fetching data')
				} else {
					this.setState({
						isLoaded: true,
						items: data.map((elem) => {
							return {
								date: elem.date,
								completedSequences: elem.completedSequences,
								uncompletedSequences: elem.uncompletedSequences,
								errorLogs: elem.errorLogs.map((log) => {
									return {
										updated_at: log.updated_at,
										message: log.message,
										type: log.type,
										x: log.x,
										y: log.y,
										z: log.z
									}
								})
							}
						})
					})
				}
			})
	}
	render() {
		const { items } = this.state

		if (!this.state.isLoaded) {
			return <div>Loading ... </div>
		} else {
			return (
				<div className="content">
					<div className="container-fluid">
						{items.map((item, index) => (
							<JsonToTable key={index} json={item} />
						))}
					</div>
				</div>
			)
		}
	}
}
