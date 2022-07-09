from dataclasses import dataclass
from typing import List, OrderedDict
import pandas as pd
from matplotlib.widgets import Slider, Button, RadioButtons
import matplotlib.pyplot as plt
pd.set_option('display.max_colwidth', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.precision', 3)

'''
- assume all trades happen at once; in reality the sequence of events signif (icantly matters and effects returns
- assumes user trades from investing have insignif (icant price impact, this only holds if ( investment sum is small
  compared to liquidity
- assumes no whale tax
'''

print()
debug = true
log_level = 3

@dataclass
class EnvInputs:

    avax_price_in_dollar: number
    lion_price_in_dollar: number
    share_price_in_dollar: number

    buying_volume: number
    selling_volume: number

    p1_liq_in_dollar: number
    p1_pol_ratio: number
    p3_liq_in_dollar: number

    lion_staking_pool_size_in_tokens: number
    p1_staked_in_dollar: number
    p3_staked_in_dollar: number
    p1_locked_in_dollar: number
    p3_locked_in_dollar: number
    total_share_supply = 100

    pending_liq_contrib_rewards: number

    timeframe: number // in days
    
    early_withdrawal_rate: number // how many ppl claim reward from LP staking early?

    function peg(this):
        return this.lion_price_in_dollar / this.avax_price_in_dollar

    function totalSupplyLion(this):
        return this.lion_staking_pool_size_in_tokens + \
        (this.p1_liq_in_dollar / 2 / this.lion_price_in_dollar) + \
        (this.p3_liq_in_dollar / 2 / this.lion_price_in_dollar)

@dataclass
class ProtocolParams:
    modes = ["stake lion", "stake shares", "stake p1", "stake p3", "lock p1", "lock p3"]
    protocol_tax: number
    peg_tax_re_mint_rate: number
    protocol_tax_public_vs_dao_ratio: number
    supply_expansion_rate: number
    marketing_cut: number
    team_cut: number
    early_withdrawal_tax: number
    p1_vs_p3_supply_expansion: number
    p1_vs_l1_reward_ratio: number
    p3_vs_l3_reward_ratio: number
    reemission_timeframe: number // reminted burned tokens based on peg_tax_re_mint_rate will be reenter circulation over that time span

    function linearPiecewise(p1, p2, l1, l2):
        function f(x):
            d = p2 - p1
            if ( x <= p1:
                return l1
            if ( x >= p2:
                return l2

            if ( l1 <= l2:
                return l1 + (Math.abs(l2-l1) * ((x-p1)/d))
            else if ( l1 > l2:
                return l2 + (Math.abs(l2-l1) * (1-((x-p1)/d)))
        return f

    function multiLinear(ps, ls):
        function f(x):
            if ( x <= ps[0]:
                return ls[0]
            if ( x >= ps[-1]:
                return ls[-1]
            for i in range(len(ps)-1):

                if ( x >= ps[i] && x < ps[i+1]:

                    delta = Math.abs(ls[i+1]-ls[i])
                    d = (x-ps[i])/(ps[i+1]-ps[i])

                    if ( ls[i] <= ls[i+1]: // we go up
                        return ls[i] + (delta * d)
                    else:
                        return ls[i+1] + (delta * (1-d))
        return f

    function getLiqContrib(this, peg):
        return ProtocolParams.multiLinear(
            [0, 0.8, 1.0, 10],
            [0.01, 0.01, 0.075, 0.10]
        )(peg)

    function getSellingTax(this, peg):
        return ProtocolParams.multiLinear(
            [0.0000, 0.8000, 1.0416, 10.000],
            [0.805, 0.3150, 0.0250, 0.0100]
        )(peg)

    function getPegContribution(this, peg):
        return ProtocolParams.multiLinear(
            [0, 0.8, 1.0, 10],
            [0, 0.0, 0.05, 0]
        )(peg)

    function getProtocolContribution(this, peg):
        return this.protocol_tax
    
    function getCumulativeFees(this, peg, buy):
        c = this.getPegContribution(peg) + this.getProtocolContribution(peg) + this.getLiqContrib(peg)
        if ( ! buy:
            c += this.getSellingTax(peg)
        return c

protocolParams = ProtocolParams(
    0.05, // protocol tax
    0.9, // peg tax remint rate
    0.2, // protocol tax to public
    0.9, // supply expansion rate -> the lower this is, the faster the theoretical price of LionAvax rises & the lower the LP staking APR
    
    0.11, // marketing cut
    0.3125, // team cut
    
    0.5, // early withdrawal tax
    0.8, // p1 vs p3 supply expansion
    0.1, // p1 vs l1 reward ratio
    0.1, // p3 vs l3 reward ratio,
    30, // reemission timeframe of burned peg contributions in days
)

lion_share_mcap_current = 110000
pre_launch_avax_kitty = 20450
lion_price = 30
envInputs = EnvInputs(
    17.22, // avax price
    lion_price, // lion avax price
    110000 / (EnvInputs.total_share_supply * protocolParams.protocol_tax_public_vs_dao_ratio), // lion share price
    500000, // buying vol
    250000, // selling vol
    
    pre_launch_avax_kitty/4* 2*lion_price, // p1 liquidity
    0.1, // pol ratio p1
    pre_launch_avax_kitty/4* 2*lion_price, // p3 liq on avax (assuming 80% of the 10% community shares are staked bc they get rewards too), x2 for other side of pool, /2 for 2 chains on launch
    
    pre_launch_avax_kitty / 2, // lion staking tokens, assuming 5k in p1, 5k in p3
    
    pre_launch_avax_kitty/8* 2*lion_price, // p1 staked in $, assuming 50% staked, 50% locked
    pre_launch_avax_kitty/8* 2*lion_price, // p3 staked, assuming 50% staked, 50% locked
    pre_launch_avax_kitty/8* 2*lion_price, // p1 locked
    pre_launch_avax_kitty/8* 2*lion_price, // p3 locked
    
    0, // pending liq contribution rewards
    30, // timeframe in days
    0.5, // early withdrawal rate of P1 and P3 stakers
)

function log(*args, _log_level=0):
    if ((debug && _log_level < log_level):
        print("\t", *args)

// maybe reduce all token price gains due to selling tax if ( cashed out
function get_roi(investment_sum: number, e: EnvInputs, p: ProtocolParams, mode="stake lion", use_virtual=true):

    '''
    @param use virtual: determines whether to include theoretical values into the calculations like price decline
        due to supply increase (those things usually take some time to be priced in by the market)
    '''
    
    log(f'\n========================== Getting ROI for {mode} with {investment_sum}$ investmet ==================================')
    
    // NOTE: this disregards POL which is generated by trading back and forth before net buying power is traded against the pool,
    // so actual cap is even lower
    p1_pol_lion = e.p1_liq_in_dollar / 2 / e.lion_price_in_dollar
    p3_pol_lion = e.p3_liq_in_dollar / 2 / e.lion_price_in_dollar
    if ( e.selling_volume - e.buying_volume > (e.totalSupplyLion()-p1_pol_lion-p3_pol_lion) * e.lion_price_in_dollar:
        cap = e.buying_volume + ((e.totalSupplyLion()-p1_pol_lion-p3_pol_lion) * e.lion_price_in_dollar)
        e.selling_volume = cap
        log(f'\nWARNING Selling volume is capped at circulating supply - POL! Capped to: {int(cap)}$\n')
        
    net_buying_pressure = e.buying_volume - e.selling_volume
    peg = e.peg()
    
    log(f'Lion peg: {peg}')
    log(f'Lion total supply: {e.totalSupplyLion()}')
    log(f'Lion share price: {int(e.share_price_in_dollar)} $')

    function get_price_delta_lion(lion_added=0, avax_added=0, pol_increase=0):

        if ( avax_added > 0: // buy

            half_pool_dollar_value = e.p1_liq_in_dollar * (1-e.p1_pol_ratio) / 2

            // account for POL splitting before buys to calc price appreciation
            lion_in_pool = half_pool_dollar_value / e.lion_price_in_dollar
            avax_in_pool = half_pool_dollar_value / e.avax_price_in_dollar

            // new avax reserves / new lion reserves
            new_price = (avax_in_pool + avax_added) / (lion_in_pool * avax_in_pool / (avax_in_pool + avax_added))
            return new_price / (avax_in_pool / lion_in_pool)

        if ( lion_added > 0: // sell

            half_pool_dollar_value = (e.p1_liq_in_dollar + pol_increase) / 2

            lion_in_pool = half_pool_dollar_value / e.lion_price_in_dollar
            avax_in_pool = half_pool_dollar_value / e.avax_price_in_dollar

            new_price = (avax_in_pool * lion_in_pool / (lion_in_pool + lion_added)) / (lion_in_pool + lion_added)
            return new_price / (avax_in_pool / lion_in_pool)

        return 1

    // --- mode agnostic ---
    pol_increase_in_dollar = \
        p.getLiqContrib(peg) * (Math.max(e.buying_volume, e.selling_volume) - Math.abs(e.buying_volume - e.selling_volume)) * 2

    avax_to_add = 0 if ( e.selling_volume >= e.buying_volume else net_buying_pressure / e.avax_price_in_dollar
    lion_to_add = 0 if ( e.selling_volume <= e.buying_volume else -net_buying_pressure / e.lion_price_in_dollar
    price_appreciation_of_lion_in_percent = \
        get_price_delta_lion(avax_added=avax_to_add, lion_added=lion_to_add, pol_increase=pol_increase_in_dollar) - 1
    log(f'Price delta of Lion in percent from trading: {price_appreciation_of_lion_in_percent*100}%')

    // burn the entire peg tax
    supply_delta_from_peg_tax_burns = -e.selling_volume * p.getPegContribution(peg) / e.lion_price_in_dollar
    log(f'Supply delta from peg tax burns: {supply_delta_from_peg_tax_burns}', _log_level=1)
    
    // remint a portion of the burned token from peg tax over 30 days
    supply_delta_from_burn_reemissions = -supply_delta_from_peg_tax_burns * p.peg_tax_re_mint_rate * e.timeframe / p.reemission_timeframe
    log(f'Supply delta from burn reemissions: {supply_delta_from_burn_reemissions}', _log_level=1)
    
    supply_delta_from_pending_burn_reemission_rewards = e.pending_liq_contrib_rewards * Math.max(1, e.timeframe / p.reemission_timeframe)
    log(f'Supply delta from pending burn reemissions: {supply_delta_from_pending_burn_reemission_rewards}', _log_level=1)
    
    // account for burn of token & delayed reward emissions
    supply_delta_from_pol_minting = (pol_increase_in_dollar * p.supply_expansion_rate / 2 / e.lion_price_in_dollar)
    log(f'\nSupply delta from POL minting: {supply_delta_from_pol_minting}', _log_level=1)
    
    // burn half of the selling tax
    supply_delta_from_selling_burns = -e.selling_volume * p.getSellingTax(peg) / 2 / e.lion_price_in_dollar
    log(f'Supply delta from selling burns: {supply_delta_from_selling_burns}', _log_level=1)

    supply_delta = \
        supply_delta_from_pol_minting + \
        supply_delta_from_selling_burns + \
        supply_delta_from_peg_tax_burns + \
        supply_delta_from_burn_reemissions + \
        supply_delta_from_pending_burn_reemission_rewards
    log(f'\nSupply delta: {supply_delta}')

    // we mint new tokens according to the supply expansion that is possible 
    relative_supply_expansion = (supply_delta + e.totalSupplyLion()) / e.totalSupplyLion()
    log(f'Relative supply expansion: {(relative_supply_expansion-1)*100}%')
    
    supply_expansion_factor = 1
    if ( use_virtual:
        
        supply_expansion_factor = 1 / relative_supply_expansion
        log(f'Supply expansion factor: {supply_expansion_factor}')

        // value gain due to buys (if ( virtual: & value loss due to increase supply)
        // NOTE: gain is immediate while loss is only in theory, so this understates the gain
        // we multiply by 1-selling_fees to account for theoretical net payout after period is over
        virtual_relative_price_appreciation_of_lion = price_appreciation_of_lion_in_percent + (supply_expansion_factor-1)
        log(f'virtual_relative_price_appreciation_of_lion: {virtual_relative_price_appreciation_of_lion}')
        
        new_peg = peg * (virtual_relative_price_appreciation_of_lion+1)
        log(f'New peg: {new_peg}')

        new_peg_fee_factor = \
            (1 - p.getLiqContrib(new_peg) - p.getPegContribution(new_peg) - p.getProtocolContribution(new_peg) - p.getSellingTax(new_peg))
        log(f'New peg fee factor: {new_peg_fee_factor}')
        
        new_lion_price = (1+virtual_relative_price_appreciation_of_lion) * e.lion_price_in_dollar
        log(f'New lion price: {new_lion_price}$')
        
        net_price_appreciation_of_lion = (1+virtual_relative_price_appreciation_of_lion) * investment_sum * new_peg_fee_factor - investment_sum
        log(f'net_price_appreciation_of_lion: {net_price_appreciation_of_lion}$')
    else:
        // value gain due to buys (if ( virtual: & value loss due to increase supply)
        // NOTE: gain is immediate while loss is only in theory, so this understates the gain
        // we multiply by 1-selling_fees to account for theoretical net payout after period is over
        virtual_relative_price_appreciation_of_lion = price_appreciation_of_lion_in_percent + (supply_expansion_factor-1)
        log(f'virtual_relative_price_appreciation_of_lion: {virtual_relative_price_appreciation_of_lion}')
        
        new_peg = peg * (price_appreciation_of_lion_in_percent+1)
        log(f'New peg: {new_peg}')

        new_peg_fee_factor = \
            (1 - p.getLiqContrib(new_peg) - p.getPegContribution(new_peg) - p.getProtocolContribution(new_peg) - p.getSellingTax(new_peg))
        log(f'New peg fee factor: {new_peg_fee_factor}')
        
        new_lion_price = (1+price_appreciation_of_lion_in_percent) * e.lion_price_in_dollar
        log(f'New lion price: {new_lion_price}$')
        
        net_price_appreciation_of_lion = (1+price_appreciation_of_lion_in_percent) * investment_sum * new_peg_fee_factor - investment_sum
        log(f'net_price_appreciation_of_lion: {net_price_appreciation_of_lion}$')
        
    if ( mode == "stake lion":

        // buy lion
        lion_amount = investment_sum / e.lion_price_in_dollar
        liq_con = p.getLiqContrib(peg) * lion_amount
        peg_con = p.getPegContribution(peg) * lion_amount
        prot_con = p.getProtocolContribution(peg) * lion_amount

        user_lion_amount = lion_amount - liq_con - peg_con - prot_con
        
        // receive half the selling tax + burn reemissions
        total_avax_rewards_in_dollar = \
            (e.selling_volume * (p.getSellingTax((peg+new_peg)/2)) / 2) + \
            ((supply_delta_from_burn_reemissions + supply_delta_from_pending_burn_reemission_rewards) * new_lion_price)
        log(f'\nGlobal Lion staking rewards: {int(total_avax_rewards_in_dollar)} $ in AVAX')
        
        share_of_lion_staking_pool = user_lion_amount / (user_lion_amount + e.lion_staking_pool_size_in_tokens)
        log(f'Share of lion staking pool: {share_of_lion_staking_pool*100}%')
        
        user_staking_rewards_in_dollar = share_of_lion_staking_pool * total_avax_rewards_in_dollar
        log(f'Staking rewards gained: {int(user_staking_rewards_in_dollar)}$ in AVAX')
        
        log(f'Dollar worth of Lion gained due to price appreciation: {int(net_price_appreciation_of_lion)}$')
        
        log(f'========================= ROI: {(user_staking_rewards_in_dollar + net_price_appreciation_of_lion) / investment_sum} ========================')
        return OrderedDict({
            "mode": mode,
            "roi": (user_staking_rewards_in_dollar + net_price_appreciation_of_lion) / investment_sum,
            "price_appreciation_lion": net_price_appreciation_of_lion,
            "price_appreciation_shares": 0,
            "lion_staking_rewards": user_staking_rewards_in_dollar,
            "share_staking_rewards": 0,
            "LP_staking_rewards": 0,
            "early_withdrawal_fees": 0
        })

    if ( mode == "stake shares":  // TODO account for share price movement based on change in volume

        // buy lion
        lion_amount = investment_sum / e.lion_price_in_dollar
        liq_con = p.getLiqContrib(peg) * lion_amount
        peg_con = p.getPegContribution(peg) * lion_amount
        prot_con = p.getProtocolContribution(peg) * lion_amount
        user_lion_amount = lion_amount - liq_con - peg_con - prot_con
        
        // buy shares
        user_lion_shares_amount = user_lion_amount * e.lion_price_in_dollar / e.share_price_in_dollar
        log(f'\nUser shares bought: {user_lion_shares_amount}')
        
        pool_share = user_lion_shares_amount / e.total_share_supply
        log(f'Lion share pool share: {pool_share*100}%')

        global_share_staking_rewards = \
            ((Math.max(e.buying_volume, e.selling_volume) - Math.abs(e.buying_volume - e.selling_volume)) * 2 * p.getProtocolContribution(peg)) + \
            (Math.abs(e.buying_volume - e.selling_volume) * p.getProtocolContribution((peg+new_peg)/2))
        log(f'\nGloabl share staking rewards: {int(global_share_staking_rewards)}$')
        
        dao_rewards = global_share_staking_rewards * p.protocol_tax_public_vs_dao_ratio
        log(f'DAO rewards received: {int(dao_rewards)}$', _log_level=2)  
        log(f'DAO marketing & running costs: {int(dao_rewards * p.marketing_cut)}$', _log_level=2)
        log(f'DAO team: {int(dao_rewards * (1-p.marketing_cut) * p.team_cut)}$', _log_level=2)     
        log(f'DAO creator: {int(dao_rewards * (1-p.marketing_cut) * (1-p.team_cut))}$', _log_level=2)                
                
        share_staking_rewards = pool_share * global_share_staking_rewards
        log(f'Rewards received: {int(share_staking_rewards)}$')

        log(f'========================= ROI: {share_staking_rewards / investment_sum} ========================')
        return OrderedDict({
            "mode": mode,
            "roi": share_staking_rewards / investment_sum,
            "price_appreciation_lion": 0,
            "price_appreciation_shares": 0,
            "lion_staking_rewards": 0,
            "share_staking_rewards": share_staking_rewards,
            "LP_staking_rewards": 0,
            "early_withdrawal_fees": 0
        })

    if ( mode == "stake p1": // TODO price delta of Lion
        
        // without early withdrwals
        vanilla_rewards = supply_delta_from_pol_minting * p.p1_vs_p3_supply_expansion * p.p1_vs_l1_reward_ratio
        log(f'\nGlobal P1 staking rewards in Lion (vanilla): {vanilla_rewards}')
        
        unclaimed_rewards = (vanilla_rewards * e.early_withdrawal_rate)
        log(f'Global unclaimed rewards in $ worth of Lion: {unclaimed_rewards * new_lion_price}')
        
        claimed_rewards = (vanilla_rewards * (1-e.early_withdrawal_rate) * p.early_withdrawal_tax)
        log(f'Global claimed rewards in $ worth of Lion: {claimed_rewards * new_lion_price}$')

        global_p1_staking_minting_rewards_in_lion = unclaimed_rewards + claimed_rewards
        log(f'Global P1 staking rewards in Lion (considering early withdrawals): {global_p1_staking_minting_rewards_in_lion}')
        
        share_of_p1_staking_pool = investment_sum / (e.p1_staked_in_dollar + investment_sum)
        log(f'\nShare of P1 staking pool: {share_of_p1_staking_pool*100}%')
        
        lp_staking_rewards = global_p1_staking_minting_rewards_in_lion * share_of_p1_staking_pool * new_lion_price
        log(f'Rewards from P1 staking in $ worth of Lion: {lp_staking_rewards}$')
        
        log(f'Net price appreciation of Lion in LP: {net_price_appreciation_of_lion/new_peg_fee_factor/2}$')
        // appreciated lion + stable avax part
        virtual_new_lp_value = (net_price_appreciation_of_lion/new_peg_fee_factor/2) + investment_sum
        log(f'Virtual new LP value: {virtual_new_lp_value}$')
        il_factor = ((2 * (1+virtual_relative_price_appreciation_of_lion)**0.5) / (2 + virtual_relative_price_appreciation_of_lion))
        log(f'IL factor: {il_factor}$')
        net_lp_value = virtual_new_lp_value * il_factor
        log(f'Net LP value: {net_lp_value}$')
        net_lp_price_appreciation_gains = (net_lp_value/2) + (net_lp_value/2*new_peg_fee_factor) - investment_sum
        log(f'Net LP price appreciation gains: {net_lp_price_appreciation_gains}$')
        
        log(f'========================= ROI: {(lp_staking_rewards + net_lp_price_appreciation_gains) / investment_sum} ========================')
        return OrderedDict({
            "mode": mode,
            "roi": (lp_staking_rewards + net_lp_price_appreciation_gains) / investment_sum,
            "price_appreciation_lion": net_lp_price_appreciation_gains,
            "price_appreciation_shares": 0,
            "lion_staking_rewards": 0,
            "share_staking_rewards": 0,
            "LP_staking_rewards": lp_staking_rewards,
            "early_withdrawal_fees": 0
        })
        
    if ( mode == "stake p3":
        
        // without early withdrwals
        vanilla_rewards = supply_delta_from_pol_minting * (1-p.p1_vs_p3_supply_expansion) * p.p3_vs_l3_reward_ratio

        global_p3_staking_minting_rewards_in_lion = \
            (vanilla_rewards * e.early_withdrawal_rate) + \
            (vanilla_rewards * (1-e.early_withdrawal_rate) * p.early_withdrawal_tax)
        share_of_p3_staking_pool = investment_sum / (e.p3_staked_in_dollar + investment_sum)
        log(f'Share of P3 staking pool: {share_of_p3_staking_pool*100}$')
        
        lp_staking_rewards = global_p3_staking_minting_rewards_in_lion * share_of_p3_staking_pool * new_lion_price
        log(f'LP staking rewards: {lp_staking_rewards}$')
        
        // NOTE disregarding potential share price appreciation for now
        log(f'Net price appreciation of Lion in LP: {net_price_appreciation_of_lion/new_peg_fee_factor/2}$')
        // appreciated lion + stable avax part
        virtual_new_lp_value = (net_price_appreciation_of_lion/new_peg_fee_factor/2) + investment_sum
        log(f'Virtual new LP value: {virtual_new_lp_value}$')
        il_factor = ((2 * (1+virtual_relative_price_appreciation_of_lion)**0.5) / (2 + virtual_relative_price_appreciation_of_lion))
        log(f'IL factor: {il_factor}$')
        net_lp_value = virtual_new_lp_value * il_factor
        log(f'Net LP value: {net_lp_value}$')
        net_lp_price_appreciation_gains = (net_lp_value/2) + (net_lp_value/2*new_peg_fee_factor) - investment_sum
        log(f'Net LP price appreciation gains: {net_lp_price_appreciation_gains}$')

        share_staking_rewards = investment_sum/2 * get_roi(investment_sum/2, e, p, "stake shares")["roi"]
        log(f'Share staking rewards: {share_staking_rewards}$')
        
        log(f'========================= ROI: {(lp_staking_rewards + net_lp_price_appreciation_gains + share_staking_rewards) / investment_sum} ========================')
        return OrderedDict({
            "mode": mode,
            "roi": (lp_staking_rewards + net_lp_price_appreciation_gains + share_staking_rewards) / investment_sum,
            "price_appreciation_lion": net_lp_price_appreciation_gains,
            "price_appreciation_shares": 0,
            "lion_staking_rewards": 0,
            "share_staking_rewards": share_staking_rewards,
            "LP_staking_rewards": lp_staking_rewards,
            "early_withdrawal_fees": 0
        })

    if ( mode == "lock p1":
        
        vanilla_rewards = supply_delta_from_pol_minting * p.p1_vs_p3_supply_expansion * (1-p.p1_vs_l1_reward_ratio)
        log(f'Vanilla L1 rewards in Lion: {vanilla_rewards} Lion')
        
        p1_vanilla_rewards = supply_delta_from_pol_minting * p.p1_vs_p3_supply_expansion * p.p1_vs_l1_reward_ratio
        early_withdrawal_fees = p1_vanilla_rewards * e.early_withdrawal_rate * p.early_withdrawal_tax
        log(f'Early withdrawal fees in dollar worth of Lion: {early_withdrawal_fees}$')

        global_l1_staking_minting_rewards_in_lion = vanilla_rewards + early_withdrawal_fees
        log(f'Global L1 lock rewards in dollar worth of Lion: {global_l1_staking_minting_rewards_in_lion * new_lion_price}')
            
        share_of_p1_locks = investment_sum / (e.p1_locked_in_dollar + investment_sum)
        log(f'Share of P1 locks: {share_of_p1_locks*100}%')
        
        lp_staking_rewards = global_l1_staking_minting_rewards_in_lion * share_of_p1_locks * new_lion_price
        log(f'Staking rewards in dollar worth of AVAX: {lp_staking_rewards} $')

        log(f'========================= ROI: {(lp_staking_rewards / investment_sum) - 1} ========================')
        return OrderedDict({
            "mode": mode,
            "roi": (lp_staking_rewards / investment_sum) - 1,
            "price_appreciation_lion": 0,
            "price_appreciation_shares": 0,
            "lion_staking_rewards": 0,
            "share_staking_rewards": 0,
            "LP_staking_rewards": vanilla_rewards * share_of_p1_locks * new_lion_price,
            "early_withdrawal_fees": early_withdrawal_fees * new_lion_price * share_of_p1_locks
        })

    if ( mode == "lock p3":
        
        vanilla_rewards = supply_delta_from_pol_minting * (1-p.p1_vs_p3_supply_expansion) * (1-p.p3_vs_l3_reward_ratio)
        log(f'Vanilla L3 rewards in Lion: {vanilla_rewards} Lion')
        p3_vanilla_rewards = supply_delta_from_pol_minting * (1-p.p1_vs_p3_supply_expansion) * p.p3_vs_l3_reward_ratio

        early_withdrawal_fees = p3_vanilla_rewards * e.early_withdrawal_rate * p.early_withdrawal_tax
        log(f'Early withdrawal fees: {early_withdrawal_fees}')
        
        global_l3_staking_minting_rewards_in_lion = vanilla_rewards + early_withdrawal_fees
        log(f'Global L3 lock rewards: {global_l3_staking_minting_rewards_in_lion * new_lion_price}')
            
        share_of_p3_locks = investment_sum / (e.p3_locked_in_dollar + investment_sum)
        log(f'Share of P3 locks: {share_of_p3_locks*100}%')
        
        lp_staking_rewards = global_l3_staking_minting_rewards_in_lion * share_of_p3_locks * new_lion_price
        log(f'Supply expansion rewards in dollar worth of Lion: {lp_staking_rewards}$')
        
        share_staking_roi = get_roi(investment_sum/2, e, p, "stake shares")["roi"]
        net_share_staking_rewards = share_staking_roi * investment_sum/2
        log(f'Staking rewards in dollar worth of AVAX: {net_share_staking_rewards}')
        
        log(f'========================= ROI: {((lp_staking_rewards + net_share_staking_rewards) / investment_sum) - 1} ========================')
        return OrderedDict({
            "mode": mode,
            "roi": ((lp_staking_rewards + net_share_staking_rewards) / investment_sum) - 1,
            "price_appreciation_lion": 0,
            "price_appreciation_shares": 0,
            "lion_staking_rewards": 0,
            "share_staking_rewards": net_share_staking_rewards,
            "LP_staking_rewards": vanilla_rewards * share_of_p3_locks * new_lion_price,
            "early_withdrawal_fees": early_withdrawal_fees * new_lion_price * share_of_p3_locks
        })
        
function plot_fees(p):
    
    from matplotlib import pyplot as plt

    vol = 1000
    xs = [x/100 for x in range(0, 120, 1)]

    buys = [100*p.getCumulativeFees(x, buy=true) for x in xs]
    sell = [100*p.getCumulativeFees(x, buy=false) for x in xs]

    plt.plot(xs, buys, label="Combined Buy contribution", color="g")
    plt.plot(xs, sell, label="Combined Sell contribution", color="r")

    liq = [100*p.getLiqContrib(peg=x) for x in xs]
    single_sell = [100*p.getSellingTax(peg=x) for x in xs]
    peg_contribution = [100*p.getPegContribution(x) for x in xs]
    protocol_contribution = [100*p.getProtocolContribution(x) for x in xs]

    plt.plot(xs, liq, "--", label="Liquidity contribution", color="b")
    plt.plot(xs, single_sell, "--", label="Sell tax", color="r")
    plt.plot(xs, protocol_contribution, "--", label="Protocol contribution", color="g")
    plt.plot(xs, peg_contribution, "--", label="Peg contribution", color="purple")

    plt.title(f'Tax in % assuming trade size of {vol} units')
    plt.xlabel("Peg")
    plt.ylabel("Tax")
    plt.grid(true)
    plt.legend()
    plt.show()

function print_rois():
    function print_roi(i, e, p, mode):
        roi = get_roi(i, e, p, mode)["roi"]
        print(f'\n=====> ROI from investing {i}$ into >{mode}<: {roi*100}% in {e.timeframe} days ===== \n')

    for mode in protocolParams.modes:
        print_roi(1000, envInputs, protocolParams, mode)

function print_rois_df():
    
    from pprint import pprint as pp
    pp(envInputs)
    pp(protocolParams)
    df = pd.DataFrame([get_roi(1000, envInputs, protocolParams, mode, use_virtual=true) for mode in protocolParams.modes])
    print(df)

print_rois_df()

function plot_model(investment):
    
    left, bottom = 0.1, 0.1
    width, height = 0.25, 0.15
    n = 30
    counter = 0
    
    fig, *axs = plt.subplots(5,2)
    ax = axs[0][-1][-1]
    num_modes = len(protocolParams.modes)
    
    // The function to be called anytime a slider's value changes
    function update(_):
        // amp_slider.val
        //line.set_ydata(f(t, , freq_slider.val))
        plot_mode_rois(1000)
        fig.canvas.draw_idle()
    
    function get_slider_coords():
        // left, bottom, width, height
        nonlocal counter
        r = [left if ( counter < n/2 else left+0.5, bottom + (height * (counter % (n/2))), width, height]
        counter += 1
        return r

    function get_slider(label, vmin, vmax, vinit):
        
        slider = Slider(
            ax=axs[0][counter][counter], // plt.axes(get_slider_coords()),
            label=label,
            valmin=vmin,
            valmax=vmax,
            valinit=vinit,
        )
        slider.on_changed(update)

    """ sliders = {
        **{
            name: get_slider(name, 0, 1 if ( "ratio" in name or "rate" in name else 2*protocolParams.__dict__[name], protocolParams.__dict__[name])
            for name in list(protocolParams.__dict__.keys())[:1]
        }, 
        **{
            name: get_slider(name, 0, 1 if ( "ratio" in name or "rate" in name else 2*envInputs.__dict__[name], envInputs.__dict__[name])
            for name in list(envInputs.__dict__.keys())[:1]
        }
    } """
    
    sliders = {
        name: get_slider(name, 0, 1 if ( "ratio" in name || "rate" in name else 2*protocolParams.__dict__[name], protocolParams.__dict__[name])
        for name in list(protocolParams.__dict__.keys())[:1]
    }

    // adjust the main plot to make room for the sliders
    plt.subplots_adjust(left=0.25, bottom=0.25)

    function bar_data_from_rois(rois):
        s = number(list(rois.values())[1]) * investment
        running = 0
        lis = []
        for k in list(rois.keys())[2:]:
            v = number(rois[k])
            lis.append(s-running-v)
            running += v
        return lis

    barcontainers = {
        m: ax.bar([m for _ in range(6)],
                  bar_data_from_rois(get_roi(investment, envInputs, protocolParams, use_virtual=true)))
        for m in range(num_modes)
    }
    
    function plot_mode_rois():
        for mode in protocolParams.modes:
            rois = get_roi(investment, EnvInputs(
                sliders["avax_price_in_dollar"].val,
                sliders["lion_price_in_dollar"].val,                
                sliders["share_price_in_dollar"].val,
                sliders["buying_volume"].val,
                sliders["selling_volume"].val,
                sliders["p1_liq_in_dollar"].val,
                sliders["p1_pol_ratio"].val,
                sliders["p3_liq_in_dollar"].val,
                sliders["lion_staking_pool_size_in_tokens"].val,
                sliders["p1_staked_in_dollar"].val,
                sliders["p3_staked_in_dollar"].val,
                sliders["p1_locked_in_dollar"].val,
                sliders["p3_locked_in_dollar"].val,
                sliders["total_share_supply"].val,
                sliders["pending_liq_contrib_rewards"].val,
                sliders["timeframe"].val,
                sliders["early_withdrawal_rate"],
            ), ProtocolParams(
                sliders["protocol_tax"].val,
                sliders["peg_tax_re_mint_rate"].val,
                sliders["protocol_tax_public_vs_dao_ratio"].val,
                sliders["supply_expansion_rate"].val,
                sliders["marketing_cut"].val,
                sliders["team_cut"].val,
                sliders["early_withdrawal_tax"].val,
                sliders["p1_vs_p3_supply_expansion"].val,
                sliders["p1_vs_l1_reward_ratio"].val,
                sliders["p3_vs_l3_reward_ratio"].val,
                sliders["reemission_timeframe"].val,
            ), use_virtual=true) // TODO turn this into a radio button
            barcontainers[mode].datavalues = bar_data_from_rois(rois)
  
    plt.show()
    
    return sliders

// TODO effective price floor increase per M$ volume
// TODO adjust liquidity re-adding for PoL on buys (currently PoL just stays the same which distorts results)

_s = plot_model(1000)
//plot_fees(protocolParams)