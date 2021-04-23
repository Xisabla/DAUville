import { makeStyles } from "@material-ui/core/styles";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import { Typography } from "@material-ui/core";
import CardContent from "components/Card/CardBody";
import CardIcon from "components/Card/CardIcon.js";
import Icon from "@material-ui/core/Icon";
import GridItem from "components/Grid/GridItem.js";
import React from "react";

const useStyles = makeStyles({
  root: {
    maxHeight: 300,
    width: 400,
  },
});

/**
 * React component method to create a card with statistic information
 * @param {Object} param0 Properties of the component
 */
export function StatsCard({ ...props }) {
  const classes = useStyles();
  // TODO: Add react prop type validation
  // eslint-disable-next-line react/prop-types
  const { title, description, small } = props;

  return (
    <GridItem xs={12} sm={6} md={3}>
      <Card>
        <CardHeader color="warning" stats icon>
          <CardIcon color="warning">
            <Icon>content_copy</Icon>
          </CardIcon>
        </CardHeader>
        <CardContent className={classes.cardContent}>
          <Typography component="p" className={classes.CardCategory}>
            {title}
          </Typography>
          <Typography
            variant="headline"
            component="h2"
            className={classes.cardTitle}
          >
            {description}{" "}
            {small !== undefined ? (
              <small className={classes.cardTitleSmall}>{small}</small>
            ) : null}
          </Typography>
        </CardContent>
      </Card>
    </GridItem>

    // <Card className={classes.root}>
    // 	<CardHeader avatar={<props.icon className={classes.cardIcon} />} />
    // 	<CardContent className={classes.cardContent}>
    // 		<Typography component="p" className={classes.CardCategory}>
    // 			{title}
    // 		</Typography>
    // 		<Typography variant="headline" component="h2" className={classes.cardTitle}>
    // 			{description}{' '}
    // 			{small !== undefined ? <small className={classes.cardTitleSmall}>{small}</small> : null}
    // 		</Typography>
    // 	</CardContent>
    // </Card>
  );
}

export default StatsCard;
