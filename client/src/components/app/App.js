import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import './light-bootstrap-dashboard.css'
import './App.css'

import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import Dashboard from '../dashboard/Dashboard'
import Myfood from '../myfood/Myfood'
import Sidebar from '../sidebar/Sidebar'

export class Main extends Component {
	render() {
		return (
			<div className="main-panel">
				<Switch>
					<Route path="/Dashboard" component={Dashboard} />
					<Route path="/Myfood" component={Myfood} />
					{/* <Redirect from="*" to="/" /> */}
				</Switch>
				{/* <Navbar />
				<Switch>
					<Route path="/Home" component={Dashboard} />
					<Route path="/Profile" component={UserProfile} />
					<Route path="/Farmbot" component={Farmbot} />
					<Route path="/Myfood" component={Myfood} />
					<Route path="/Chariots" component={Chariots} />
					<Route path="/Login" component={Login} />
					<Route exact path="/register" component={Register} />
					<Redirect from="*" to="/dashboard" />
				</Switch>
				<Footer /> */}
			</div>
		)
	}
}

export class App extends Component {
	render() {
		return (
			<div className="wrapper">
				<Router>
					<Sidebar />
					<Route path="/" component={Main} />
				</Router>
			</div>
		)
	}
}
