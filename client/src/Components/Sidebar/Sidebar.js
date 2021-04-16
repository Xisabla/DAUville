import React, { Component } from 'react'
import { Link, NavLink } from 'react-router-dom'

import farmbot from './img/farmbot.jpg'
import greenhouse from './img/greenhouse.png'

export class Sidebar extends Component {
	render() {
		return (
			<div className="sidebar">
				<div className="sidebar-wrapper">
					<div className="logo">
						<Link to="/" className="simple-text">
							Dashboard DAUville
						</Link>
					</div>
					<ul className="nav">
						<li className="nav-item">
							<NavLink className="nav-link" to="/Dashboard">
								<i className="nc-icon nc-chart-pie-35"></i>
								<p>Dashboard</p>
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/Profile">
								<i className="nc-icon nc-circle-09"></i>
								<p>User Profile</p>
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/Farmbot">
								<img className="Farmbot" src={farmbot} alt="ImgFarmbot" />
								<p>Farmbot</p>
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/Myfood">
								<img className="Myfood" src={greenhouse} alt="Greenhouse" />
								<p>MyFood</p>
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink className="nav-link" to="/Carts">
								<i className="nc-icon nc-circle-09"></i>
								<p>Cultivation Carts</p>
							</NavLink>
						</li>
					</ul>
				</div>
			</div>
		)
	}
}
