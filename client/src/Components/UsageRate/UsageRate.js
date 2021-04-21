import React, { Component } from 'react'
/* eslint-disable react/prop-types */
export class usageRate extends Component {
	constructor(props) {
		super(props)
		this.state = {}
		this.state.filterText = ''
		this.state.nbText = 0
		this.state.plants = []
	}
	handleUserInput(filterText) {
		this.setState({ filterText: filterText })
	}
	handlePlantsInput(nbText) {
		this.setState({ nbText: nbText })
	}

	handleAddEvent() {
		if (this.state.plants.length < this.state.nbText) {
			var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36)
			var plant = {
				id: id,
				Element: '',
				Commentaire: ''
			}

			this.state.plants.push(plant)
			this.setState(this.state.plants)
		}
	}

	handlePlantTable(evt) {
		var item = {
			id: evt.target.id,
			name: evt.target.name,
			value: evt.target.value
		}
		var plants = this.state.plants.slice()
		var newPlants = plants.map(function (plant) {
			for (var key in plant) {
				if (key == item.name && plant.id == item.id) {
					plant[key] = item.value
				}
			}
			return plant
		})
		this.setState({ plants: newPlants })
		var counters = 0
		this.counters = React.createRef()
		for (let i = 0; i < this.state.plants.length; i++) {
			if ((this.state.plants[i].Commentaire === '') & (this.state.plants[i].Element === '')) counters++
		}
		this.counters = counters
	}
	handleRowDel(plant) {
		var index = this.state.plants.indexOf(plant)
		this.state.plants.splice(index, 1)
		console.log(index)
		this.setState(this.state.plants)
	}
	render() {
		return (
			<div className="content">
				<div className="container-fluid">
					<div className="row">
						<SearchBar filterText={this.state.filterText} onUserInput={this.handleUserInput.bind(this)} />
						<PlantsBar nbText={this.state.nbText} onUserInput={this.handlePlantsInput.bind(this)} />
						<PlantTable
							EmptyItemCounter={this.counters}
							onPlantTableUpdate={this.handlePlantTable.bind(this)}
							onRowAdd={this.handleAddEvent.bind(this)}
							onRowDel={this.handleRowDel.bind(this)}
							plants={this.state.plants}
							filterText={this.state.filterText}
						/>
					</div>
				</div>
			</div>
		)
	}
}
class PlantsBar extends React.Component {
	updateInputValue() {
		this.props.onUserInput(this.nbrTextInput.value)
	}
	render() {
		return (
			<div>
				<input
					type="text"
					placeholder="Nb plants max"
					value={this.props.nbText}
					ref={(ref) => (this.nbrTextInput = ref)}
					onChange={this.updateInputValue.bind(this)}
				/>
			</div>
		)
	}
}

class SearchBar extends React.Component {
	handleChange() {
		this.props.onUserInput(this.filterTextInput.value)
	}
	render() {
		return (
			<div>
				<input
					type="text"
					placeholder="Search..."
					value={this.props.filterText}
					ref={(ref) => (this.filterTextInput = ref)}
					onChange={this.handleChange.bind(this)}
				/>
			</div>
		)
	}
}

class PlantTable extends React.Component {
	render() {
		var onPlantTableUpdate = this.props.onPlantTableUpdate
		var rowDel = this.props.onRowDel
		var EmptyItemCounter = this.props.EmptyItemCounter
		var filterText = this.props.filterText
		var plant = this.props.plants.map(function (plant) {
			if (plant.Element.indexOf(filterText) === -1) {
				return
			}
			return (
				<PlantRow
					onPlantTableUpdate={onPlantTableUpdate}
					plant={plant}
					onDelEvent={rowDel.bind(this)}
					key={plant.id}
				/>
			)
		})
		return (
			<div>
				<button type="button" onClick={this.props.onRowAdd} className="btn btn-success pull-right">
					Add
				</button>
				<table className="table table-bordered">
					<thead>
						<th colSpan="2" className="Rowcss">
							Chariot
						</th>
					</thead>
					<tr></tr>

					<tr>
						<th className="Rowcss">Element </th>
						<th className="Rowcss">Commentaire</th>
					</tr>

					<tbody>{plant}</tbody>
					<thead>
						<tr>
							<th colSpan="1" className="Rowcss">
								<b>Usage Rate : {(1 - (EmptyItemCounter / plant.length).toFixed(2)) * 100} % </b>
							</th>
						</tr>
					</thead>
				</table>
			</div>
		)
	}
}

class PlantRow extends React.Component {
	onDelEvent() {
		this.props.onDelEvent(this.props.plant)
	}
	render() {
		return (
			<tr className="eachRow">
				<EditableCell
					onPlantTableUpdate={this.props.onPlantTableUpdate}
					cellData={{
						type: 'Element',
						value: this.props.plant.Element,
						id: this.props.plant.id
					}}
				/>
				<EditableCell
					onPlantTableUpdate={this.props.onPlantTableUpdate}
					cellData={{
						type: 'Commentaire',
						value: this.props.plant.Commentaire,
						id: this.props.plant.id
					}}
				/>

				<td className="del-cell">
					<input type="button" onClick={this.onDelEvent.bind(this)} value="X" className="del-btn" />
				</td>
			</tr>
		)
	}
}
class EditableCell extends React.Component {
	render() {
		return (
			<td>
				<input
					type="text"
					size="50"
					name={this.props.cellData.type}
					id={this.props.cellData.id}
					value={this.props.cellData.value}
					onChange={this.props.onPlantTableUpdate}
				/>
			</td>
		)
	}
}
