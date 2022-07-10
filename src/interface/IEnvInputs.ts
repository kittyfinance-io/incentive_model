export interface IEnvInputs {
  avax_price_in_dollar: number;
  lion_price_in_dollar: number;
  // share_price_in_dollar: number;

  buying_volume: number;
  selling_volume: number;
  prev_volume: number;

  p1_liq_in_dollar: number;
  p1_pol_ratio: number;
  p3_liq_in_dollar: number;

  lion_staking_pool_size_in_tokens: number;
  p1_staked_in_dollar: number;
  p3_staked_in_dollar: number;
  p1_locked_in_dollar: number;
  p3_locked_in_dollar: number;
  // total_share_supply: number;
  // total_share_supply = 100;
  pending_liq_contrib_rewards: number;
  timeframe: number; // in days
  early_withdrawal_rate: number;
  // peg: () => number;
  // totalSupplyLion: () => number;
}

