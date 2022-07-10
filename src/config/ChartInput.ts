const precent_increment = 0.01;

export const StepInput = {
  protocol_tax: precent_increment,
  peg_tax_re_mint_rate: precent_increment,
  protocol_tax_public_vs_dao_ratio: precent_increment,
  supply_expansion_rate: precent_increment,
  marketing_cut: precent_increment,
  team_cut: precent_increment,
  early_withdrawal_tax: precent_increment,
  p1_vs_p3_supply_expansion: precent_increment,
  p1_vs_l1_reward_ratio: precent_increment,
  p3_vs_l3_reward_ratio: precent_increment,
  reemission_timeframe: 1,

  avax_price_in_dollar: precent_increment,
  lion_price_in_dollar: precent_increment, // ** Lion Price
  share_price_in_dollar: precent_increment,

  buying_volume: 10000,
  selling_volume: 10000,
  prev_volume: 10000,

  p1_liq_in_dollar: 1000,
  p1_pol_ratio: precent_increment,
  p3_liq_in_dollar: 1000,

  lion_staking_pool_size_in_tokens: 1,
  p1_staked_in_dollar: 1000,
  p3_staked_in_dollar: 1000,
  p1_locked_in_dollar: 1000,
  p3_locked_in_dollar: 1000,
  total_share_supply: precent_increment,

  pending_liq_contrib_rewards: 1,
  timeframe: 1, // in days
  early_withdrawal_rate: precent_increment,
};

export const MaxInput = {
  protocol_tax: 1,
  peg_tax_re_mint_rate: 1,
  protocol_tax_public_vs_dao_ratio: 1,
  supply_expansion_rate: 1,
  marketing_cut: 1,
  team_cut: 1,
  early_withdrawal_tax: 1,
  p1_vs_p3_supply_expansion: 1,
  p1_vs_l1_reward_ratio: 1,
  p3_vs_l3_reward_ratio: 1,
  reemission_timeframe: 90,

  avax_price_in_dollar: 200,
  lion_price_in_dollar: 1000, // ** Lion Price
  share_price_in_dollar: 200000,

  buying_volume: 10000000,
  selling_volume: 10000000,
  prev_volume: 10000000,

  p1_liq_in_dollar: 2000000,
  p1_pol_ratio: 1,
  p3_liq_in_dollar: 2000000,

  lion_staking_pool_size_in_tokens: 100000,
  p1_staked_in_dollar: 1000000,
  p3_staked_in_dollar: 1000000,
  p1_locked_in_dollar: 200000,
  p3_locked_in_dollar: 200000,
  total_share_supply: 100,

  pending_liq_contrib_rewards: 100000,
  timeframe: 90, // in days
  early_withdrawal_rate: 1,
};

export const MinInput = {
  protocol_tax: 0,
  peg_tax_re_mint_rate: 0,
  protocol_tax_public_vs_dao_ratio: 0,
  supply_expansion_rate: 0,
  marketing_cut: 0,
  team_cut: 0,
  early_withdrawal_tax: 0,
  p1_vs_p3_supply_expansion: 0,
  p1_vs_l1_reward_ratio: 0,
  p3_vs_l3_reward_ratio: 0,
  reemission_timeframe: 0,

  avax_price_in_dollar: 1,
  lion_price_in_dollar: 0, // ** Lion Price
  share_price_in_dollar: 0,

  buying_volume: 0,
  selling_volume: 0,
  prev_volume: 0,

  p1_liq_in_dollar: 1000,
  p1_pol_ratio: 0,
  p3_liq_in_dollar: 1000,

  lion_staking_pool_size_in_tokens: 0,
  p1_staked_in_dollar: 1000,
  p3_staked_in_dollar: 1000,
  p1_locked_in_dollar: 1000,
  p3_locked_in_dollar: 1000,
  total_share_supply: 1,

  pending_liq_contrib_rewards: 0,
  timeframe: 1, // in days
  early_withdrawal_rate: 0,
};

export const UnitInput = {
  protocol_tax: "%",
  peg_tax_re_mint_rate: "%",
  protocol_tax_public_vs_dao_ratio: "%",
  supply_expansion_rate: "%",
  marketing_cut: "%",
  team_cut: "%",
  early_withdrawal_tax: "%",
  p1_vs_p3_supply_expansion: "%",
  p1_vs_l1_reward_ratio: "%",
  p3_vs_l3_reward_ratio: "%",
  reemission_timeframe: "days",

  avax_price_in_dollar: "$",
  lion_price_in_dollar: "$", // ** Lion Price
  share_price_in_dollar: "$",

  buying_volume: "$",
  selling_volume: "$",
  prev_volume: "$",

  p1_liq_in_dollar: "$",
  p1_pol_ratio: "%",
  p3_liq_in_dollar: "$",

  lion_staking_pool_size_in_tokens: "Lion",
  p1_staked_in_dollar: "$",
  p3_staked_in_dollar: "$",
  p1_locked_in_dollar: "$",
  p3_locked_in_dollar: "$",
  total_share_supply: "$",

  pending_liq_contrib_rewards: "$",
  timeframe: "days", // in days
  early_withdrawal_rate: "%",
};
