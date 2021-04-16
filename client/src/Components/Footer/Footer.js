import React, { Component } from 'react'
import { Link } from 'react-router-dom'

/**
 * Page footer component
 */
export class Footer extends Component {
	render() {
		return (
			<footer className="footer">
				<div className="container-fluid">
					<nav>
						<ul className="footer-menu">
							<li>
								<Link to="/">Home</Link>
							</li>
						</ul>
						<p className="copyright text-center">© 2021</p>
					</nav>
				</div>
			</footer>
		)
	}
}
