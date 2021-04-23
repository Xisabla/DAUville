import React, { Component } from "react";

import rawMyfoodData from "../MyFood/measuresbrest.json";

/**
 * Component that shows the main values of the farmbot information
 */
export class Farmbot extends Component {
  render() {
    return rawMyfoodData.map((item) => {
      if (item.sensor === "pH Sensor") {
        return <h1>{item.value}</h1>;
      }
    });
  }
}
export default Farmbot;
