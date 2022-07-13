import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { EnvInputs, get_roi, ProtocolParams } from "reward";
import { __debounce } from "utils/debounce";
import { IProtocol } from "interface/IProtocol";
import { IEnvInputs } from "interface/IEnvInputs";
import InputSlider from "components/InputSlider";
import { MaxInput, MinInput, StepInput, UnitInput } from "config/ChartInput";
import _ from "lodash";
import Paper from "@mui/material/Paper";
import ChartROI from "./ChartROI";
import { IChart } from "interface/IChart";
import { useParams, useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Env values
  const [investAmount, setInvestAmount] = React.useState<number>(1000);
  const pre_launch_avax_kitty = 20450;
  // Chart Data
  const [chartData, setChartData] = useState<any[]>([]);
  // Protocol Params
  const [stateProtocolParams, setStateProtocolParams] = useState<IProtocol>({
    protocol_tax: 0.05,
    peg_tax_re_mint_rate: 0.9,
    protocol_tax_public_vs_dao_ratio: 0.2,
    supply_expansion_rate: 0.9,
    // marketing_cut: 0.11,
    // team_cut: 0.3125,
    early_withdrawal_tax: 0.5,
    p1_vs_p3_supply_expansion: 0.8,
    p1_vs_l1_reward_ratio: 0.1,
    p3_vs_l3_reward_ratio: 0.1,
    reemission_timeframe: 30, // ** Invest Time
  });
  // Env Inputs

  const [stateEnvInputs, setStateEnvInputs] = useState<IEnvInputs>({
    avax_price_in_dollar: 17.22,
    lion_price_in_dollar: 30, // ** Lion Price
    // share_price_in_dollar: 5500, // 110000 / (100 * protocolParams.protocol_tax_public_vs_dao_ratio)

    buying_volume: 500000,
    selling_volume: 250000,
    prev_volume: 0,

    p1_liq_in_dollar: (pre_launch_avax_kitty / 4) * 2 * 30,
    p1_pol_ratio: 0.1,
    p3_liq_in_dollar: (pre_launch_avax_kitty / 4) * 2 * 30,

    lion_staking_pool_size_in_tokens: pre_launch_avax_kitty / 2,
    p1_staked_in_dollar: (pre_launch_avax_kitty / 8) * 2 * 30,
    p3_staked_in_dollar: (pre_launch_avax_kitty / 8) * 2 * 30,
    p1_locked_in_dollar: (pre_launch_avax_kitty / 8) * 2 * 30,
    p3_locked_in_dollar: (pre_launch_avax_kitty / 8) * 2 * 30,

    pending_liq_contrib_rewards: 0,
    timeframe: 30, // in days
    early_withdrawal_rate: 0.5,
  });

  const IProt2Prot = (protocolParams: IProtocol) => {
    return new ProtocolParams(
      stateProtocolParams.protocol_tax, // protocol tax
      stateProtocolParams.peg_tax_re_mint_rate, // peg tax remint rate
      stateProtocolParams.protocol_tax_public_vs_dao_ratio, // protocol tax to public
      stateProtocolParams.supply_expansion_rate, // supply expansion rate -> the lower this is, the faster the theoretical price of LionAvax rises & the lower the LP staking APR

      0.11, //   stateProtocolParams.marketing_cut, // marketing cut
      0.3125, //   stateProtocolParams.team_cut, // team cut

      stateProtocolParams.early_withdrawal_tax, // early withdrawal tax
      stateProtocolParams.p1_vs_p3_supply_expansion, // p1 vs p3 supply expansion
      stateProtocolParams.p1_vs_l1_reward_ratio, // p1 vs l1 reward ratio
      stateProtocolParams.p3_vs_l3_reward_ratio, // p3 vs l3 reward ratio,
      stateProtocolParams.reemission_timeframe // reemission timeframe of burned peg contributions in days
    );
  };

  const IEnv2Env = (stateEnvInputs: IEnvInputs, protocolParams: IProtocol) => {
    return new EnvInputs(
      stateEnvInputs.avax_price_in_dollar, // avax price
      stateEnvInputs.lion_price_in_dollar, // lion avax price
      110000 / (100 * protocolParams.protocol_tax_public_vs_dao_ratio), // lion share price
      stateEnvInputs.buying_volume, // buying vol
      stateEnvInputs.selling_volume, // selling vol
      stateEnvInputs.prev_volume,

      stateEnvInputs.p1_liq_in_dollar, // p1 liquidity
      stateEnvInputs.p1_pol_ratio, // pol ratio p1
      stateEnvInputs.p3_liq_in_dollar, // p3 liq on avax (assuming 80% of the 10% community shares are staked bc they get rewards too), x2 for other side of pool, /2 for 2 chains on launch

      stateEnvInputs.lion_staking_pool_size_in_tokens, // lion staking tokens, assuming 5k in p1, 5k in p3

      stateEnvInputs.p1_staked_in_dollar,
      stateEnvInputs.p3_staked_in_dollar,
      stateEnvInputs.p1_locked_in_dollar,
      stateEnvInputs.p3_locked_in_dollar,

      stateEnvInputs.pending_liq_contrib_rewards, // pending liq contribution rewards
      stateEnvInputs.timeframe, // timeframe in days
      stateEnvInputs.early_withdrawal_rate // early withdrawal rate of P1 and P3 stakers
    );
  };

  useEffect(() => {
    __debounce(
      () => {
        const protocolParams = IProt2Prot(stateProtocolParams);

        const envInputs = IEnv2Env(stateEnvInputs, stateProtocolParams);

        let _chart: IChart[] = [];

        protocolParams.modes.forEach((item) => {
          const getRoi: any = get_roi(
            investAmount,
            envInputs,
            protocolParams,
            item
          );
          const roi = getRoi!["roi"];

          // console.log(
          //   `\n=====> ROI from investing ${investAmount}$ into >${item}<: ${
          //     roi * 100
          //   }% in ${envInputs.timeframe} days ===== \n`
          // );

          _chart.push({
            strategy: item,
            roi: Number(roi.toFixed(2)) * 100,
            price_appreciation_lion:
              Number(
                (getRoi.price_appreciation_lion / investAmount).toFixed(2)
              ) * 100,
            price_appreciation_shares:
              Number(
                (getRoi.price_appreciation_shares / investAmount).toFixed(2)
              ) * 100,
            lion_staking_rewards:
              Number((getRoi.lion_staking_rewards / investAmount).toFixed(2)) *
              100,
            share_staking_rewards:
              Number((getRoi.share_staking_rewards / investAmount).toFixed(2)) *
              100,
            lp_staking_rewards:
              Number((getRoi.LP_staking_rewards / investAmount).toFixed(2)) *
              100,
            early_withdrawal_fees:
              Number((getRoi.early_withdrawal_fees / investAmount).toFixed(2)) *
              100,
          });
        });

        setChartData(_chart);
      },
      1000,
      "Calculate ROI"
    );
  }, [
    investAmount,
    pre_launch_avax_kitty,
    stateEnvInputs,
    stateProtocolParams,
  ]);

  // Get query params

  useEffect(() => {
    // if (!_.isEmpty(searchParams)) {
    let _stateProtocolParams: IProtocol = { ...stateProtocolParams };
    let _stateEnvInputs: IEnvInputs = { ...stateEnvInputs };

    Object.keys(stateProtocolParams).forEach((item: string) => {
      if (searchParams.get(item)) {
        _stateProtocolParams = {
          ..._stateProtocolParams,
          [item as keyof IProtocol]: Number(searchParams.get(item)),
        };
      }
    });

    Object.keys(stateEnvInputs).forEach((item: string) => {
      // console.log("searchParams.get(item)1", item, searchParams.get(item));
      if (searchParams.get(item)) {
        // console.log("searchParams.get(item)2", item, searchParams.get(item));
        _stateEnvInputs = {
          ..._stateEnvInputs,
          [item as keyof IEnvInputs]: Number(searchParams.get(item)),
        };
      }
    });

    if (searchParams.get("investAmount")) {
      console.log(
        'searchParams.get("investAmount")',
        searchParams.get("investAmount")
      );
      setInvestAmount(+searchParams.get("investAmount")!);
    }

    if (
      JSON.stringify(_stateProtocolParams) !==
      JSON.stringify(stateProtocolParams)
    ) {
      setStateProtocolParams(_stateProtocolParams);
    }

    if (JSON.stringify(_stateEnvInputs) !== JSON.stringify(stateEnvInputs)) {
      setStateEnvInputs(_stateEnvInputs);
    }
  }, [searchParams]);
  console.log("stateEnvInputs", stateEnvInputs);

  const encodeQuery = (mode?: string) => {
    // get_roi
    let newRoi = mode
      ? get_roi(
          investAmount,
          IEnv2Env(stateEnvInputs, stateProtocolParams),
          IProt2Prot(stateProtocolParams),
          mode,
          false
        )
      : null;

    console.log("mode", mode, "\nnew roi", newRoi);

    let resulting_env: IEnvInputs | undefined = newRoi?.resulting_env;

    let query: string = window.location.href.split("?")[0] + "?";
    Object.keys(stateProtocolParams).forEach((item: string, index: number) => {
      //   console.log("item", item);
      //   console.log(
      //     "stateProtocolParams[item as keyof IProtocol]",
      //     stateProtocolParams[item as keyof IProtocol]
      //   );
      if (index !== 0) query = query + "&";
      query += `${item}=${stateProtocolParams[item as keyof IProtocol]}`;
      console.log("query :>> ", query);
    });
    Object.keys(resulting_env ? resulting_env : stateEnvInputs).forEach(
      (item: string, index: number) => {
        //   console.log("item", item);
        //   console.log(
        //     "stateProtocolParams[item as keyof IProtocol]",
        //     stateProtocolParams[item as keyof IProtocol]
        //   );

        query += `&${item}=${
          resulting_env
            ? resulting_env[item as keyof IEnvInputs]
            : stateEnvInputs[item as keyof IEnvInputs]
        }`;
      }
    );
    query += `&investAmount=${investAmount}`;
    console.log("query", query);
    window.open(query, "_blank");
  };

  return (
    <Box>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          width: "100%",
          zIndex: 1,
        }}
      >
        <Paper sx={{ px: 5 }}>
          <Button
            variant="contained"
            sx={{ ml: 3, mt: 3 }}
            onClick={() => encodeQuery()}
          >
            Encode Query
          </Button>
          <ChartROI chartData={chartData} />
        </Paper>
      </Box>

      <Grid container spacing={2}>
        <Grid item>
          <Button onClick={() => encodeQuery("stake lion")}>stake lion</Button>
        </Grid>
        <Grid item>
          <Button onClick={() => encodeQuery("stake shares")}>
            stake shares
          </Button>
        </Grid>
        <Grid item>
          <Button onClick={() => encodeQuery("stake p1")}>stake p1</Button>
        </Grid>
        <Grid item>
          <Button onClick={() => encodeQuery("stake p3")}>stake p3</Button>
        </Grid>
        <Grid item>
          <Button onClick={() => encodeQuery("lock p1")}>lock p1</Button>
        </Grid>
        <Grid item>
          <Button onClick={() => encodeQuery("lock p3")}>lock p3</Button>
        </Grid>
      </Grid>

      <Grid container columnSpacing={5} marginTop={5} sx={{ px: 5 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="h4" color="red" textAlign="center">
            Protocol Params
          </Typography>

          {Object.keys(stateProtocolParams).map((item, index) => (
            <InputSlider
              key={index}
              name={item.replaceAll("_", " ")}
              value={stateProtocolParams[item as keyof IProtocol]}
              maxValue={MaxInput[item as keyof IProtocol]}
              minValue={MinInput[item as keyof IProtocol]}
              stepValue={StepInput[item as keyof IProtocol]}
              unitValue={UnitInput[item as keyof IProtocol]}
              setValue={(value) =>
                setStateProtocolParams({
                  ...stateProtocolParams,
                  [item as keyof IProtocol]: value,
                })
              }
            />
          ))}
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h4" color="red" textAlign="center">
            Env Inputs
          </Typography>

          <Grid container columnSpacing={5}>
            {/* <Grid item xs={12} md={6}>
              <InputSlider
                name="Invest Money"
                value={investAmount}
                maxValue={10000}
                unitValue={"$"}
                setValue={(value) => setInvestAmount(value)}
              />
            </Grid> */}
            {Object.keys(stateEnvInputs).map((item, index) => (
              <Grid item xs={12} md={6}>
                <InputSlider
                  name={item.replaceAll("_", " ")}
                  key={index}
                  value={stateEnvInputs[item as keyof IEnvInputs]}
                  maxValue={MaxInput[item as keyof IEnvInputs]}
                  minValue={MinInput[item as keyof IProtocol]}
                  stepValue={StepInput[item as keyof IProtocol]}
                  unitValue={UnitInput[item as keyof IProtocol]}
                  setValue={(value) =>
                    setStateEnvInputs({
                      ...stateEnvInputs,
                      [item as keyof IProtocol]: value,
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
