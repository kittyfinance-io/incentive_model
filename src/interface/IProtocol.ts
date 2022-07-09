export interface IProtocol {
  protocol_tax: number;
  peg_tax_re_mint_rate: number;
  protocol_tax_public_vs_dao_ratio: number;
  supply_expansion_rate: number;
  // marketing_cut: number;
  // team_cut: number;
  early_withdrawal_tax: number;
  p1_vs_p3_supply_expansion: number;
  p1_vs_l1_reward_ratio: number;
  p3_vs_l3_reward_ratio: number;
  reemission_timeframe: number;
//   modes: string[];
//   linearPiecewise?: any;
//   multiLinear?: any;
//   getLiqContrib?: any;
//   getSellingTax?: any;
//   getPegContribution?: () => number;
//   getProtocolContribution?: () => number;
//   getCumulativeFees?: () => number;
}
