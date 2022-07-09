import React from "react";

import {
  Chart,
  BarSeries,
  LineSeries,
  ArgumentAxis,
  ValueAxis,
  Title,
  Legend,
  Tooltip,
} from "@devexpress/dx-react-chart-material-ui";
import { EventTracker } from "@devexpress/dx-react-chart";
import { ValueScale, Stack } from "@devexpress/dx-react-chart";

const Label = (symbol) => (props) => {
  const { text } = props;
  return <ValueAxis.Label {...props} text={text + symbol} />;
};
const LabelWithThousand = Label(" %");

const modifyOilDomain = (domain) => {
  return [domain[0], domain[1]];
};

const ChartROI = ({ chartData }) => {
  return (
    <Chart data={chartData}>
      <ValueScale name="ROI" modifyDomain={modifyOilDomain} />

      <ArgumentAxis />
      <ValueAxis
        scaleName="ROI"
        labelComponent={LabelWithThousand}
        showLine
        showGrid
      />

      <Title text="ROI %" />

      <BarSeries
        name="Early Withdraw Fees"
        valueField="early_withdrawal_fees"
        argumentField="strategy"
        scaleName="ROI"
      />
      <BarSeries
        name="LP Staking Rewards"
        valueField="lp_staking_rewards"
        argumentField="strategy"
        scaleName="ROI"
      />
      <BarSeries
        name="Share Staking Rewards"
        valueField="share_staking_rewards"
        argumentField="strategy"
        scaleName="ROI"
      />
      <BarSeries
        name="Lion Staking Rewards"
        valueField="lion_staking_rewards"
        argumentField="strategy"
        scaleName="ROI"
      />
      <BarSeries
        name="Price Appreciation Shares"
        valueField="price_appreciation_shares"
        argumentField="strategy"
        scaleName="ROI"
      />
      <BarSeries
        name="Price Appreciation Lion"
        valueField="price_appreciation_lion"
        argumentField="strategy"
        scaleName="ROI"
      />
      <LineSeries
        name="Roi"
        valueField="roi"
        argumentField="strategy"
        scaleName="ROI"
      />
      <EventTracker />
      <Tooltip />
      <Stack
        stacks={[
          {
            series: [
              "Early Withdraw Fees",
              "LP Staking Rewards",
              "Share Staking Rewards",
              "Lion Staking Rewards",
              "Price Appreciation Shares",
              "Price Appreciation Lion",
            ],
          },
        ]}
      />
      <Legend />
    </Chart>
  );
};

export default ChartROI;
