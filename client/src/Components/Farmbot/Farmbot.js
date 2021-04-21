import React, { Component } from 'react'
import { JsonToTable } from "react-json-to-table";
/**
 * Component that shows the main values of the farmbot information
 */

export class Farmbot extends Component {
	constructor(props) {
		super(props);
		this.state = {
		  items: [],
		  isLoaded: false,
		};
	  }
	componentDidMount() {
		const sumups = fetch('/getFarmbotDailySumUp')
			.then((res) => res.json())
			.then((data) => {
				this.setState({
					isLoaded: true,
					items: data
				  });
				if (data.error) {
					console.log('')
				} else {
					const todaySumup = data[data.length - 1]
					//console.log(data) // { date: ..., completedSequences: [ ... ], uncompletedSequences: [ ... ], errorLogs: [ ... ] }
				}
			})
	}
	render() {
		const { items } = this.state;

		if (!this.state.isLoaded) {
		  return <div>Loading ... </div>;
		} else {
		  return (
			<div className="content">
			<div className="container-fluid">
			{items.map(item => <JsonToTable json={item} />)}
			</div >
				</div >
		  );
		}
	  }
}
