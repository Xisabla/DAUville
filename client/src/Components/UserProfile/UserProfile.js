import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import ISA from './img/ISA.jpg'

/**
 * Component that allow the user to see his main information and to edit some
 * NOTE: This is currently a test component which is static
 */
export class UserProfile extends Component {
	render() {
		return (
			<div className="content">
				<div className="container-fluid">
					<div className="row">
						<div className="col-md-4">
							<div className="card card-user">
								<div className="card-image">
									<img
										src="https://www.aiisalille.com/ressources/temp/80_851_15325625295x521_47239263804_1850847815_22020132255-1601983291-logo-groupe-junia.jpeg"
										alt="..."
									/>
								</div>
								<div className="card-body">
									<div className="author">
										<Link to="/">
											<img className="avatar border-gray" src={ISA} alt="..." />
											<h5 className="title">Farmbot</h5>
										</Link>
										<p className="description">Test ISA</p>
									</div>
									<p className="description text-center">
										&ldquo;ISA&ldquo;
										<br /> TEST
									</p>
								</div>
								<hr />
								<div className="button-container mr-auto ml-auto">
									<button className="btn btn-simple btn-link btn-icon">
										<i className="fa fa-facebook-square"></i>
									</button>
									<button className="btn btn-simple btn-link btn-icon">
										<i className="fa fa-twitter"></i>
									</button>
									<button className="btn btn-simple btn-link btn-icon">
										<i className="fa fa-google-plus-square"></i>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}
