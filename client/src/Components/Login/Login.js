import React, { Component } from 'react'
import CheckButton from 'react-validation/build/button'
import Form from 'react-validation/build/form'
import Input from 'react-validation/build/input'

import { login } from '../../Services/'

const required = (value) => {
	if (!value) {
		return (
			<div className="alert alert-danger" role="alert">
				This field is required!
			</div>
		)
	}
}

/**
 * Component that manage the user login process
 */
export class Login extends Component {
	constructor(props) {
		super(props)
		this.handleLogin = this.handleLogin.bind(this)
		this.onChangeEmail = this.onChangeEmail.bind(this)
		this.onChangePassword = this.onChangePassword.bind(this)

		this.state = {
			email: '',
			password: '',
			loading: false,
			message: ''
		}
	}

	onChangeEmail(e) {
		this.setState({
			email: e.target.value
		})
	}

	onChangePassword(e) {
		this.setState({
			password: e.target.value
		})
	}

	handleLogin(e) {
		e.preventDefault()

		this.setState({
			message: '',
			loading: true
		})

		this.form.validateAll()

		if (this.checkBtn.context._errors.length === 0) {
			const { email, password } = this.state

			login(email, password)
				.then(() => {
					// TODO: Add react prop type validation
					// eslint-disable-next-line react/prop-types
					this.props.history.push('/Dashboard')
				})
				.catch((error) => {
					const errorMessage = error.message ?? error.response ?? error.error ?? JSON.stringify(error)

					this.setState({ loading: false, message: errorMessage })
				})
		} else {
			this.setState({
				loading: false
			})
		}
	}

	render() {
		return (
			<div className="col-md-12">
				<div className="card card-container">
					<img
						src="//ssl.gstatic.com/accounts/ui/avatar_2x.png"
						alt="profile-img"
						className="profile-img-card"
					/>

					<Form
						onSubmit={this.handleLogin}
						ref={(c) => {
							this.form = c
						}}
					>
						<div className="form-group">
							<label htmlFor="email">E-mail address</label>
							<Input
								type="email"
								className="form-control"
								name="email"
								value={this.state.email}
								onChange={this.onChangeEmail}
								validations={[required]}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="password">Password</label>
							<Input
								type="password"
								className="form-control"
								name="password"
								value={this.state.password}
								onChange={this.onChangePassword}
								validations={[required]}
							/>
						</div>

						<div className="form-group">
							<button className="btn btn-primary btn-block" disabled={this.state.loading}>
								{this.state.loading && <span className="spinner-border spinner-border-sm"></span>}
								<span>Login</span>
							</button>
						</div>

						{this.state.message && (
							<div className="form-group">
								<div className="alert alert-danger" role="alert">
									{this.state.message}
								</div>
							</div>
						)}
						<CheckButton
							style={{ display: 'none' }}
							ref={(c) => {
								this.checkBtn = c
							}}
						/>
					</Form>
				</div>
			</div>
		)
	}
}
