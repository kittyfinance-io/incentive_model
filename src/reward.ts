export class EnvInputs {
  avax_price_in_dollar: number;
  lion_price_in_dollar: number;
  share_price_in_dollar: number;

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
  total_share_supply = 100;

  pending_liq_contrib_rewards: number;

  timeframe: number; // in days

  early_withdrawal_rate: number; // how many ppl claim reward from LP staking early?

  constructor(
    avax_price_in_dollar: number,
    lion_price_in_dollar: number,
    share_price_in_dollar: number,

    buying_volume: number,
    selling_volume: number,
    prev_volume: number,

    p1_liq_in_dollar: number,
    p1_pol_ratio: number,
    p3_liq_in_dollar: number,

    lion_staking_pool_size_in_tokens: number,
    p1_staked_in_dollar: number,
    p3_staked_in_dollar: number,
    p1_locked_in_dollar: number,
    p3_locked_in_dollar: number,
    // total_share_supply: number,

    pending_liq_contrib_rewards: number,

    timeframe: number, // in days

    early_withdrawal_rate: number
  ) {
    this.avax_price_in_dollar = avax_price_in_dollar;
    this.lion_price_in_dollar = lion_price_in_dollar;
    this.share_price_in_dollar = share_price_in_dollar;
    this.buying_volume = buying_volume;
    this.selling_volume = selling_volume;
    this.prev_volume = prev_volume;
    this.p1_liq_in_dollar = p1_liq_in_dollar;
    this.p1_pol_ratio = p1_pol_ratio;
    this.p3_liq_in_dollar = p3_liq_in_dollar;
    this.lion_staking_pool_size_in_tokens = lion_staking_pool_size_in_tokens;
    this.p1_staked_in_dollar = p1_staked_in_dollar;
    this.p3_staked_in_dollar = p3_staked_in_dollar;
    this.p1_locked_in_dollar = p1_locked_in_dollar;
    this.p3_locked_in_dollar = p3_locked_in_dollar;
    this.pending_liq_contrib_rewards = pending_liq_contrib_rewards;
    this.timeframe = timeframe;
    this.early_withdrawal_rate = early_withdrawal_rate;
  }

  peg() {
    return this.lion_price_in_dollar / this.avax_price_in_dollar;
  }

  totalSupplyLion() {
    return (
      this.lion_staking_pool_size_in_tokens +
      this.p1_liq_in_dollar / 2 / this.lion_price_in_dollar +
      this.p3_liq_in_dollar / 2 / this.lion_price_in_dollar
    );
  }
}

export class ProtocolParams {
  modes: string[];
  protocol_tax: number;
  peg_tax_re_mint_rate: number;
  protocol_tax_public_vs_dao_ratio: number;
  supply_expansion_rate: number;
  marketing_cut: number;
  team_cut: number;
  early_withdrawal_tax: number;
  p1_vs_p3_supply_expansion: number;
  p1_vs_l1_reward_ratio: number;
  p3_vs_l3_reward_ratio: number;
  reemission_timeframe: number; // reminted burned tokens based on peg_tax_re_mint_rate will be reenter circulation over that time span

  constructor(
    protocol_tax: number,
    peg_tax_re_mint_rate: number,
    protocol_tax_public_vs_dao_ratio: number,
    supply_expansion_rate: number,
    marketing_cut: number,
    team_cut: number,
    early_withdrawal_tax: number,
    p1_vs_p3_supply_expansion: number,
    p1_vs_l1_reward_ratio: number,
    p3_vs_l3_reward_ratio: number,
    reemission_timeframe: number
  ) {
    this.modes = [
      "stake lion",
      "stake shares",
      "stake p1",
      "stake p3",
      "lock p1",
      "lock p3",
    ];
    this.protocol_tax = protocol_tax;
    this.peg_tax_re_mint_rate = peg_tax_re_mint_rate;
    this.protocol_tax_public_vs_dao_ratio = protocol_tax_public_vs_dao_ratio;
    this.supply_expansion_rate = supply_expansion_rate;
    this.marketing_cut = marketing_cut;
    this.team_cut = team_cut;
    this.early_withdrawal_tax = early_withdrawal_tax;
    this.p1_vs_p3_supply_expansion = p1_vs_p3_supply_expansion;
    this.p1_vs_l1_reward_ratio = p1_vs_l1_reward_ratio;
    this.p3_vs_l3_reward_ratio = p3_vs_l3_reward_ratio;
    this.reemission_timeframe = reemission_timeframe;
  }

  linearPiecewise(p1: number, p2: number, l1: number, l2: number) {
    const f = (x: number) => {
      var d;
      d = p2 - p1;

      if (x <= p1) {
        return l1;
      }

      if (x >= p2) {
        return l2;
      }

      if (l1 <= l2) {
        return l1 + Math.abs(l2 - l1) * ((x - p1) / d);
      } else {
        if (l1 > l2) {
          return l2 + Math.abs(l2 - l1) * (1 - (x - p1) / d);
        }
      }
    };

    return f;
  }

  multiLinear(ps: number[], ls: number[]) {
    const f = (x: number) => {
      var d, delta;

      if (x <= ps[0]) {
        return ls[0];
      }

      if (x >= ps.slice(-1)[0]) {
        return ls.slice(-1)[0];
      }

      for (var i = 0; i < ps.length - 1; i++) {
        if (x >= ps[i] && x < ps[i + 1]) {
          delta = Math.abs(ls[i + 1] - ls[i]);
          d = (x - ps[i]) / (ps[i + 1] - ps[i]);

          if (ls[i] <= ls[i + 1]) {
            return ls[i] + delta * d;
          } else {
            return ls[i + 1] + delta * (1 - d);
          }
        }
      }
    };

    return f;
  }

  getLiqContrib(peg: number) {
    return this.multiLinear([0, 0.8, 1.0, 10], [0.01, 0.01, 0.075, 0.1])(peg);
  }

  getSellingTax(peg: number) {
    return this.multiLinear(
      [0.0, 0.8, 1.0416, 10.0],
      [0.805, 0.315, 0.025, 0.01]
    )(peg);
  }

  getPegContribution(peg: number) {
    return this.multiLinear([0, 0.8, 1.0, 10], [0, 0.0, 0.05, 0])(peg);
  }

  getProtocolContribution(peg: number) {
    return this.protocol_tax;
  }

  getCumulativeFees(peg: number, buy: boolean) {
    let c =
      this.getPegContribution(peg)! +
      this.getProtocolContribution(peg) +
      this.getLiqContrib(peg)!;
    if (!buy) c += this.getSellingTax(peg)!;
    return c;
  }
}

export const get_roi = (
  investment_sum: number,
  e: EnvInputs,
  p: ProtocolParams,
  mode = "stake lion",
  use_virtual = true
) => {
  console.log(
    `\n======================================= Getting ROI for ${mode} with ${investment_sum}$ investmet ===================================================`
  );

  // NOTE: this disregards POL which is generated by trading back and forth before net buying power is traded against the pool,
  // so actual cap is even lower
  let p1_pol_lion = e.p1_liq_in_dollar / 2 / e.lion_price_in_dollar;
  let p3_pol_lion = e.p3_liq_in_dollar / 2 / e.lion_price_in_dollar;

  if (e.selling_volume - e.buying_volume > (e.totalSupplyLion() - p1_pol_lion - p3_pol_lion) * e.lion_price_in_dollar) {
    let cap = e.buying_volume + (e.totalSupplyLion() - p1_pol_lion - p3_pol_lion) * e.lion_price_in_dollar;
    e.selling_volume = cap;
    console.log(`\nWARNING Selling volume is capped at circulating supply - POL! Capped to: ${Number(cap)}$\n`);
  }

  let net_buying_pressure = e.buying_volume - e.selling_volume;
  let peg = e.peg();

  console.log(`Lion peg: ${peg}`);
  console.log(`Lion total supply: ${e.totalSupplyLion()}`);
  console.log(`Lion share price: ${Number(e.share_price_in_dollar)} $`);

  function get_price_delta_lion(
    lion_added = 0,
    avax_added = 0,
    pol_increase = 0
  ) {

    if (avax_added > 0) {
      // buy

      // disregard POL splitting before buys to calc price appreciation for now
      let half_pool_dollar_value = (e.p1_liq_in_dollar + pol_increase) / 2;

      let lion_in_pool = half_pool_dollar_value / e.lion_price_in_dollar;
      let avax_in_pool = half_pool_dollar_value / e.avax_price_in_dollar;

      // new avax reserves / new lion reserves
      let new_price = (avax_in_pool + avax_added) / (lion_in_pool * avax_in_pool / (avax_in_pool + avax_added));
      return new_price / (avax_in_pool / lion_in_pool);
    }

    if (lion_added > 0) {

      // sell
      let half_pool_dollar_value = (e.p1_liq_in_dollar + pol_increase) / 2;

      let lion_in_pool = half_pool_dollar_value / e.lion_price_in_dollar;
      let avax_in_pool = half_pool_dollar_value / e.avax_price_in_dollar;

      let new_price = avax_in_pool * lion_in_pool / (lion_in_pool + lion_added) / (lion_in_pool + lion_added);
      return new_price / (avax_in_pool / lion_in_pool);
    }
    return 1;
  }

  // --- mode agnostic ---
  let pol_increase_in_dollar = p.getLiqContrib(peg)! * (e.buying_volume + e.selling_volume);

  let avax_to_add =
    e.selling_volume >= e.buying_volume
      ? 0
      : net_buying_pressure / e.avax_price_in_dollar;
  let lion_to_add =
    e.selling_volume <= e.buying_volume
      ? 0
      : net_buying_pressure / e.lion_price_in_dollar;

  let price_appreciation_of_lion_in_percent = get_price_delta_lion(lion_to_add, avax_to_add, pol_increase_in_dollar) - 1;
  let price_appreciation_of_shares_in_percent = 
    e.prev_volume === 0 
    ? 0
    : ((e.buying_volume + e.selling_volume) / e.prev_volume) - 1;

  console.log(
    `Price delta of Lion in percent from trading: ${price_appreciation_of_lion_in_percent * 100
    }%`
  );

  // burn the entire peg tax
  let supply_delta_from_peg_tax_burns =
    (-e.selling_volume * p.getPegContribution(peg)!) / e.lion_price_in_dollar;
  console.log(
    `Supply delta from peg tax burns: ${supply_delta_from_peg_tax_burns}`
  );

  // remint a portion of the burned token from peg tax over 30 days
  let supply_delta_from_burn_reemissions = 
    -supply_delta_from_peg_tax_burns * p.peg_tax_re_mint_rate * e.timeframe / p.reemission_timeframe;
  console.log(
    `Supply delta from burn reemissions: ${supply_delta_from_burn_reemissions}`
  );

  let supply_delta_from_pending_burn_reemission_rewards =
    e.pending_liq_contrib_rewards *
    Math.max(1, e.timeframe / p.reemission_timeframe);
  console.log(
    `Supply delta from pending burn reemissions: ${supply_delta_from_pending_burn_reemission_rewards}`
  );

  // account for burn of token & delayed reward emissions
  let supply_delta_from_pol_minting =
    (pol_increase_in_dollar * p.supply_expansion_rate) /
    2 /
    e.lion_price_in_dollar;
  console.log(
    `\nSupply delta from POL minting: ${supply_delta_from_pol_minting}`
  );

  // burn half of the selling tax
  let supply_delta_from_selling_burns =
    (-e.selling_volume * p.getSellingTax(peg)!) / 2 / e.lion_price_in_dollar;
  console.log(
    `Supply delta from selling burns: ${supply_delta_from_selling_burns}`
  );

  let supply_delta =
    supply_delta_from_pol_minting +
    supply_delta_from_selling_burns +
    supply_delta_from_peg_tax_burns +
    supply_delta_from_burn_reemissions +
    supply_delta_from_pending_burn_reemission_rewards;
  console.log(`\nSupply delta: ${supply_delta}`);

  // we mint new tokens according to the supply expansion that is possible
  let relative_supply_expansion =
    (supply_delta + e.totalSupplyLion()) / e.totalSupplyLion();
  console.log(
    `Relative supply expansion: ${(relative_supply_expansion - 1) * 100}%`
  );

  let supply_expansion_factor = 1;

  let virtual_relative_price_appreciation_of_lion;
  let new_peg;
  let new_peg_fee_factor;
  let new_lion_price;
  let net_price_appreciation_of_lion;
  if (use_virtual) {
    supply_expansion_factor = 1 / relative_supply_expansion;
    console.log(`Supply expansion factor: ${supply_expansion_factor}`);

    // value gain due to buys (if ( virtual: & value loss due to increase supply)
    // NOTE: gain is immediate while loss is only in theory, so this understates the gain
    // we multiply by 1-selling_fees to account for theoretical net payout after period is over
    virtual_relative_price_appreciation_of_lion =
      price_appreciation_of_lion_in_percent + (supply_expansion_factor - 1);
    console.log(
      `virtual_relative_price_appreciation_of_lion: ${virtual_relative_price_appreciation_of_lion}`
    );

    new_peg = peg * (virtual_relative_price_appreciation_of_lion + 1);
    console.log(`New peg: ${new_peg}`);

    new_peg_fee_factor =
      1 -
      p.getLiqContrib(new_peg)! -
      p.getPegContribution(new_peg)! -
      p.getProtocolContribution(new_peg)! -
      p.getSellingTax(new_peg)!;
    console.log(`New peg fee factor: ${new_peg_fee_factor}`);

    new_lion_price =
      (1 + virtual_relative_price_appreciation_of_lion) *
      e.lion_price_in_dollar;
    console.log(`New lion price: ${new_lion_price}$`);

    net_price_appreciation_of_lion =
      (1 + virtual_relative_price_appreciation_of_lion) *
      investment_sum *
      new_peg_fee_factor -
      investment_sum;
    console.log(
      `net_price_appreciation_of_lion: ${net_price_appreciation_of_lion}$`
    );
  } else {
    // value gain due to buys (if ( virtual: & value loss due to increase supply)
    // NOTE: gain is immediate while loss is only in theory, so this understates the gain
    // we multiply by 1-selling_fees to account for theoretical net payout after period is over
    virtual_relative_price_appreciation_of_lion =
      price_appreciation_of_lion_in_percent + (supply_expansion_factor - 1);
    console.log(
      `virtual_relative_price_appreciation_of_lion: ${virtual_relative_price_appreciation_of_lion}`
    );

    new_peg = peg * (price_appreciation_of_lion_in_percent + 1);
    console.log(`New peg: ${new_peg}`);

    new_peg_fee_factor =
      1 -
      p.getLiqContrib(new_peg)! -
      p.getPegContribution(new_peg)! -
      p.getProtocolContribution(new_peg)! -
      p.getSellingTax(new_peg)!;
    console.log(`New peg fee factor: ${new_peg_fee_factor}`);

    new_lion_price = (1 + price_appreciation_of_lion_in_percent) * e.lion_price_in_dollar;

    console.log(`New lion price: ${new_lion_price}$`);

    net_price_appreciation_of_lion =
      ((1 + price_appreciation_of_lion_in_percent) * investment_sum * new_peg_fee_factor) - investment_sum;

    console.log(
      `net_price_appreciation_of_lion: ${net_price_appreciation_of_lion}$`
    );
  }

  if (mode === "stake lion") {

    // buy lion
    let lion_amount = investment_sum / e.lion_price_in_dollar;
    let liq_con = p.getLiqContrib(peg)! * lion_amount;
    let peg_con = p.getPegContribution(peg)! * lion_amount;
    let prot_con = p.getProtocolContribution(peg)! * lion_amount;

    let user_lion_amount = lion_amount - liq_con - peg_con - prot_con;

    // receive half the selling tax + burn reemissions
    let total_avax_rewards_in_dollar =
      (e.selling_volume * p.getSellingTax((peg + new_peg) / 2)!) / 2 +
      (supply_delta_from_burn_reemissions +  supply_delta_from_pending_burn_reemission_rewards) * new_lion_price;

    console.log(`\nGlobal Lion staking rewards: ${Number(total_avax_rewards_in_dollar)} $ in AVAX` );

    let share_of_lion_staking_pool =
      user_lion_amount /
      (user_lion_amount + e.lion_staking_pool_size_in_tokens);

    console.log(`Share of lion staking pool: ${share_of_lion_staking_pool * 100}%`);

    let user_staking_rewards_in_dollar = share_of_lion_staking_pool * total_avax_rewards_in_dollar;

    console.log(`Staking rewards gained: ${Number(user_staking_rewards_in_dollar)}$ in AVAX`);
    console.log(
      `Dollar worth of Lion gained due to price appreciation: ${Number(
        net_price_appreciation_of_lion
      )}$`
    );
    console.log(
      `===================================== ROI: ${(user_staking_rewards_in_dollar + net_price_appreciation_of_lion) /
      investment_sum
      } ====================================`
    );

    return {
      mode: mode,
      roi: (user_staking_rewards_in_dollar + (net_price_appreciation_of_lion * new_peg_fee_factor)) / investment_sum,
      price_appreciation_lion: net_price_appreciation_of_lion * new_peg_fee_factor,
      price_appreciation_shares: 0,
      lion_staking_rewards: user_staking_rewards_in_dollar,
      share_staking_rewards: 0,
      LP_staking_rewards: 0,
      early_withdrawal_fees: 0,
    };
  }

  if (mode === "stake shares") {
    // TODO account for share price movement based on change in volume

    // buy lion
    let lion_amount = investment_sum / e.lion_price_in_dollar;
    let liq_con = p.getLiqContrib(peg)! * lion_amount;
    let peg_con = p.getPegContribution(peg)! * lion_amount;
    let prot_con = p.getProtocolContribution(peg) * lion_amount;
    let user_lion_amount = lion_amount - liq_con - peg_con - prot_con;

    // buy shares
    let user_lion_shares_amount = (user_lion_amount * e.lion_price_in_dollar) / e.share_price_in_dollar;
    console.log(`\nUser shares bought: ${user_lion_shares_amount}`);

    let pool_share = user_lion_shares_amount / e.total_share_supply;
    console.log(`Lion share pool share: ${pool_share * 100}%`);

    let global_share_staking_rewards =
      (Math.min(e.buying_volume, e.selling_volume) * 2 * p.getProtocolContribution(peg)) +
      (Math.abs(e.buying_volume - e.selling_volume) * p.getProtocolContribution((peg + new_peg) / 2));

    console.log(`\nGloabl share staking rewards: ${Number(global_share_staking_rewards)}$`);

    let dao_rewards = global_share_staking_rewards * (1-p.protocol_tax_public_vs_dao_ratio);

    console.log(`DAO rewards received: ${Number(dao_rewards)}$`);
    console.log(`DAO marketing & running costs: ${Number(dao_rewards * p.marketing_cut)}$`);
    console.log(`DAO team: ${Number(dao_rewards * (1 - p.marketing_cut) * p.team_cut)}$`);
    console.log(`DAO creator: ${Number(dao_rewards * (1 - p.marketing_cut) * (1 - p.team_cut))}$`);

    let share_staking_rewards = pool_share * global_share_staking_rewards;
    console.log(`Rewards received: ${Number(share_staking_rewards)}$`);

    let price_appreciation_rewards = user_lion_shares_amount * e.share_price_in_dollar * price_appreciation_of_shares_in_percent * new_peg_fee_factor;

    console.log(
      `===================================== ROI: ${share_staking_rewards / investment_sum
      } ====================================`
    );

    return {
      mode: mode,
      roi: (share_staking_rewards + price_appreciation_rewards) / investment_sum,
      price_appreciation_lion: 0,
      price_appreciation_shares: price_appreciation_rewards,
      lion_staking_rewards: 0,
      share_staking_rewards: share_staking_rewards,
      LP_staking_rewards: 0,
      early_withdrawal_fees: 0,
    };
  }

  if (mode === "stake p1") {
    // TODO price delta of Lion

    // without early withdrwals
    let vanilla_rewards =
      supply_delta_from_pol_minting *
      p.p1_vs_p3_supply_expansion *
      p.p1_vs_l1_reward_ratio;

    console.log(
      `\nGlobal P1 staking rewards in Lion (vanilla): ${vanilla_rewards}`
    );

    let unclaimed_rewards = vanilla_rewards * e.early_withdrawal_rate;
    console.log(
      `Global unclaimed rewards in $ worth of Lion: ${unclaimed_rewards * new_lion_price
      }`
    );

    let claimed_rewards = vanilla_rewards * (1 - e.early_withdrawal_rate) * p.early_withdrawal_tax;
    console.log(
      `Global claimed rewards in $ worth of Lion: ${claimed_rewards * new_lion_price
      }$`
    );

    let global_p1_staking_minting_rewards_in_lion = unclaimed_rewards + claimed_rewards;
    console.log(
      `Global P1 staking rewards in Lion (considering early withdrawals): ${global_p1_staking_minting_rewards_in_lion}`
    );

    let share_of_p1_staking_pool = investment_sum / (e.p1_staked_in_dollar + investment_sum);
    console.log(
      `\nShare of P1 staking pool: ${share_of_p1_staking_pool * 100}%`
    );

    let lp_staking_rewards =
      global_p1_staking_minting_rewards_in_lion *
      share_of_p1_staking_pool *
      new_lion_price;
    console.log(
      `Rewards from P1 staking in $ worth of Lion: ${lp_staking_rewards}$`
    );

    console.log(
      `Net price appreciation of Lion in LP: ${net_price_appreciation_of_lion / 2}$`);

    // appreciated lion + stable avax part
    let virtual_new_lp_value = (net_price_appreciation_of_lion / 2) + (investment_sum/2);
    console.log(`Virtual new LP value: ${virtual_new_lp_value}$`);

    let il_factor =
      (2 * (1 + virtual_relative_price_appreciation_of_lion) ** 0.5) /
      (2 + virtual_relative_price_appreciation_of_lion);
    console.log(`IL factor: ${il_factor}$`);

    let net_lp_value = virtual_new_lp_value * il_factor;
    console.log(`Net LP value: ${net_lp_value}$`);

    let net_lp_price_appreciation_gains =
      (net_lp_value / 2) +
      ((net_lp_value / 2) * new_peg_fee_factor) -
      investment_sum;
    console.log(`Net LP price appreciation gains: ${net_lp_price_appreciation_gains}$`);

    console.log(
      `===================================== ROI: ${(lp_staking_rewards + net_lp_price_appreciation_gains) / investment_sum
      } ====================================`
    );
    return {
      mode: mode,
      roi: (lp_staking_rewards + net_lp_price_appreciation_gains) / investment_sum,
      price_appreciation_lion: net_lp_price_appreciation_gains,
      price_appreciation_shares: 0,
      lion_staking_rewards: 0,
      share_staking_rewards: 0,
      LP_staking_rewards: lp_staking_rewards,
      early_withdrawal_fees: 0,
    };
  }

  if (mode === "stake p3") {

    // without early withdrwals
    let vanilla_rewards =
      supply_delta_from_pol_minting *
      (1 - p.p1_vs_p3_supply_expansion) *
      p.p3_vs_l3_reward_ratio;

    let global_p3_staking_minting_rewards_in_lion =
      vanilla_rewards * e.early_withdrawal_rate +
      vanilla_rewards * (1 - e.early_withdrawal_rate) * p.early_withdrawal_tax;

    let share_of_p3_staking_pool = investment_sum / (e.p3_staked_in_dollar + investment_sum);

    console.log(`Share of P3 staking pool: ${share_of_p3_staking_pool * 100}$`);

    let lp_staking_rewards =
      global_p3_staking_minting_rewards_in_lion *
      share_of_p3_staking_pool *
      new_lion_price;

    console.log(`LP staking rewards: ${lp_staking_rewards}$`);

    // NOTE disregarding potential share price appreciation for now
    console.log(`Net price appreciation of Lion in LP: ${net_price_appreciation_of_lion / 2}$`);

    // appreciated lion
    let virtual_new_lp_value = 
      (net_price_appreciation_of_lion / 2) + 
      (investment_sum/2 * (1+price_appreciation_of_shares_in_percent));
    console.log(`Virtual new LP value: ${virtual_new_lp_value}$`);

    // no idea if this approach accurately calculates delta for IL with 2 assets changing value but should be close enough
    let il_delta = Math.abs(virtual_relative_price_appreciation_of_lion - price_appreciation_of_shares_in_percent);
    let il_factor = (2 * (1 + il_delta) ** 0.5) / (2 + il_delta);
    console.log(`IL factor: ${il_factor}$`);

    let net_lp_value = virtual_new_lp_value * il_factor;
    console.log(`Net LP value: ${net_lp_value}$`);

    let net_lp_price_appreciation_gains = (net_lp_value * new_peg_fee_factor) - investment_sum;
    console.log(`Net LP price appreciation gains: ${net_lp_price_appreciation_gains}$`);

    let getRoi: any = get_roi(investment_sum / 2, e, p, "stake shares");

    let share_staking_rewards = (investment_sum / 2) * getRoi["roi"];

    console.log(`Share staking rewards: ${share_staking_rewards}$`);

    console.log(
      `===================================== ROI: ${(lp_staking_rewards +
        net_lp_price_appreciation_gains +
        share_staking_rewards) /
      investment_sum
      } ====================================`
    );

    return {
      mode: mode,
      roi: (lp_staking_rewards + net_lp_price_appreciation_gains + share_staking_rewards) / investment_sum,
      price_appreciation_lion: net_lp_price_appreciation_gains/2,
      price_appreciation_shares: net_lp_price_appreciation_gains/2,
      lion_staking_rewards: 0,
      share_staking_rewards: share_staking_rewards,
      LP_staking_rewards: lp_staking_rewards,
      early_withdrawal_fees: 0,
    };
  }

  if (mode === "lock p1") {
    let vanilla_rewards =
      supply_delta_from_pol_minting *
      p.p1_vs_p3_supply_expansion *
      (1 - p.p1_vs_l1_reward_ratio);
    console.log(`Vanilla L1 rewards in Lion: ${vanilla_rewards} Lion`);

    let p1_vanilla_rewards =
      supply_delta_from_pol_minting *
      p.p1_vs_p3_supply_expansion *
      p.p1_vs_l1_reward_ratio;
    let early_withdrawal_fees =
      p1_vanilla_rewards * e.early_withdrawal_rate * p.early_withdrawal_tax;
    console.log(
      `Early withdrawal fees in dollar worth of Lion: ${early_withdrawal_fees}$`
    );

    let global_l1_staking_minting_rewards_in_lion =
      vanilla_rewards + early_withdrawal_fees;
    console.log(
      `Global L1 lock rewards in dollar worth of Lion: ${global_l1_staking_minting_rewards_in_lion * new_lion_price
      }`
    );

    let share_of_p1_locks =
      investment_sum / (e.p1_locked_in_dollar + investment_sum);
    console.log(`Share of P1 locks: ${share_of_p1_locks * 100}%`);

    let lp_staking_rewards =
      global_l1_staking_minting_rewards_in_lion *
      share_of_p1_locks *
      new_lion_price;
    console.log(
      `Staking rewards in dollar worth of AVAX: ${lp_staking_rewards} $`
    );

    console.log(
      `===================================== ROI: ${lp_staking_rewards / investment_sum - 1
      } ====================================`
    );
    return {
      mode: mode,
      roi: lp_staking_rewards / investment_sum - 1,
      price_appreciation_lion: 0,
      price_appreciation_shares: 0,
      lion_staking_rewards: 0,
      share_staking_rewards: 0,
      LP_staking_rewards: vanilla_rewards * share_of_p1_locks * new_lion_price,
      early_withdrawal_fees:
        early_withdrawal_fees * new_lion_price * share_of_p1_locks,
    };
  }

  if (mode === "lock p3") {
    let vanilla_rewards =
      supply_delta_from_pol_minting *
      (1 - p.p1_vs_p3_supply_expansion) *
      (1 - p.p3_vs_l3_reward_ratio);
    console.log(`Vanilla L3 rewards in Lion: ${vanilla_rewards} Lion`);
    let p3_vanilla_rewards =
      supply_delta_from_pol_minting *
      (1 - p.p1_vs_p3_supply_expansion) *
      p.p3_vs_l3_reward_ratio;

    let early_withdrawal_fees =
      p3_vanilla_rewards * e.early_withdrawal_rate * p.early_withdrawal_tax;
    console.log(`Early withdrawal fees: ${early_withdrawal_fees}`);

    let global_l3_staking_minting_rewards_in_lion =
      vanilla_rewards + early_withdrawal_fees;
    console.log(
      `Global L3 lock rewards: ${global_l3_staking_minting_rewards_in_lion * new_lion_price
      }`
    );

    let share_of_p3_locks =
      investment_sum / (e.p3_locked_in_dollar + investment_sum);
    console.log(`Share of P3 locks: ${share_of_p3_locks * 100}%`);

    let lp_staking_rewards =
      global_l3_staking_minting_rewards_in_lion *
      share_of_p3_locks *
      new_lion_price;
    console.log(
      `Supply expansion rewards in dollar worth of Lion: ${lp_staking_rewards}$`
    );

    let getRoi: any = get_roi(investment_sum / 2, e, p, "stake shares");

    let share_staking_roi = getRoi["roi"];
    let net_share_staking_rewards = (share_staking_roi * investment_sum) / 2;
    console.log(
      `Staking rewards in dollar worth of AVAX: ${net_share_staking_rewards}`
    );

    console.log(
      `===================================== ROI: ${(lp_staking_rewards + net_share_staking_rewards) / investment_sum - 1
      } ====================================`
    );
    return {
      mode: mode,
      roi:
        (lp_staking_rewards + net_share_staking_rewards) / investment_sum - 1,
      price_appreciation_lion: 0,
      price_appreciation_shares: 0,
      lion_staking_rewards: 0,
      share_staking_rewards: net_share_staking_rewards,
      LP_staking_rewards: vanilla_rewards * share_of_p3_locks * new_lion_price,
      early_withdrawal_fees:
        early_withdrawal_fees * new_lion_price * share_of_p3_locks,
    };
  }

};

export const print_rois = (
  investAmount: number,
  envInputs: EnvInputs,
  protocolParams: ProtocolParams
) => {
  function print_roi(i: number, e: EnvInputs, p: ProtocolParams, mode: string) {
    let getRoi = get_roi(i, e, p, mode);
    let roi = getRoi!["roi"];
    console.log(
      `\n=====> ROI from investing ${i}$ into >${mode}<: ${roi * 100}% in ${e.timeframe
      } days ===== \n`
    );
  }
  protocolParams.modes.forEach((item) => {
    print_roi(investAmount, envInputs, protocolParams, item);
  });
};
