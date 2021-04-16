import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import './light-bootstrap-dashboard.css'
import './App.css'

import React, { Component } from 'react'
import { BrowserRouter as Router, Link, Redirect, Route, Switch } from 'react-router-dom'

import { CultivationCarts, Dashboard, Farmbot, Footer, Login, Myfood, Register, Sidebar, UserProfile } from '../'

/**
 * Component that manage the routes
 */
export class Main extends Component {
	render() {
		const stringifiedUser = localStorage.getItem('user')
		const user = stringifiedUser ? JSON.parse(stringifiedUser) : null

		return (
			<div className="main-panel">
				<Switch>
					<Route path="/Dashboard" component={Dashboard} />
					<Route path="/Profile" component={UserProfile} />
					<Route path="/Farmbot" component={Farmbot} />
					<Route path="/Myfood" component={Myfood} />
					<Route path="/Carts" component={CultivationCarts} />
					<Route path="/Login" component={Login} />
					<Route path="/Register" component={Register} />
					<Route path="/Home">
						{/* Note: This is probably temporarily, this route content should be removed or moved to a dedicated component */}
						<div>
							{user ? (
								<a
									href="#"
									onClick={() => {
										localStorage.removeItem('user')
										localStorage.removeItem('token')
										window.location.reload()
									}}
								>
									Disconnect
								</a>
							) : (
								<Link to="/Login">Login</Link>
							)}
							{user && user.type === 'ADMIN' ? <Link to="/Register">Create account</Link> : ''}
						</div>
					</Route>
					<Redirect from="*" to="/Home" />
				</Switch>
				<Footer />
			</div>
		)
	}
}

/**
 * Base entry Component
 */
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
