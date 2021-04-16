import { makeStyles } from '@material-ui/core/styles'
import { Card, CardContent, CardHeader, Typography } from 'material-ui'
import React from 'react'

const useStyles = makeStyles({
	root: {
		maxHeight: 300,
		width: 400
	}
})

/**
 * React component method to create a card with statistic information
 * @param {Object} param0 Properties of the component
 */
export function StatsCard({ ...props }) {
	const classes = useStyles()
	// TODO: Add react prop type validation
	// eslint-disable-next-line react/prop-types
	const { title, description, small } = props

	return (
		<Card className={classes.root}>
			<CardHeader avatar={<props.icon className={classes.cardIcon} />} />
			<CardContent className={classes.cardContent}>
				<Typography component="p" className={classes.CardCategory}>
					{title}
				</Typography>
				<Typography variant="headline" component="h2" className={classes.cardTitle}>
					{description}{' '}
					{small !== undefined ? <small className={classes.cardTitleSmall}>{small}</small> : null}
				</Typography>
			</CardContent>
		</Card>
	)
}
