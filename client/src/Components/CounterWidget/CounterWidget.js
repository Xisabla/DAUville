import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Card } from 'react-bootstrap'

/**
 * React Component
 * @param {Object} props Properties of the component
 */
export const CounterWidget = (props) => {
	// TODO: Add react prop type validation
	// eslint-disable-next-line react/prop-types
	const { icon, iconColor, category, title, percentage, content } = props
	const percentageColor = percentage < 0 ? 'text-danger' : 'text-success'

	return (
		<Card border="light" className="shadow-sm">
			<Card.Body>
				<div className={`icon icon-shape icon-md icon-${iconColor} rounded me-4 me-sm-0`}>
					<FontAwesomeIcon icon={icon} />
					{content}
				</div>
				<div className="d-sm-none">
					<h5>{category}</h5>
					<h3 className="mb-1">{title}</h3>
				</div>
				<div className="small mt-2">
					<span className={`${percentageColor} fw-bold`}>{percentage}%</span> Since last month
				</div>
			</Card.Body>
		</Card>
	)
}
