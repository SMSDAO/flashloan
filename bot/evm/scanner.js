// bot/evm/scanner.js — Opportunity scanner (multi-DEX price comparison)
import { ethers } from 'ethers';
import { config } from './config.js';

const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
];

const ARBITRAGE_ABI = [
  'function simulateProfit(address asset, uint256 amount, address dexA, address dexB, address tokenB) external view returns (uint256 expectedProfit, uint256 fee)',
];

/**
 * @typedef {Object} Opportunity
 * @property {string} label
 * @property {string} asset
 * @property {string} tokenB
 * @property {string} dexA
 * @property {string} dexB
 * @property {bigint} loanAmount
 * @property {bigint} expectedProfit
 * @property {bigint} fee
 */

export class OpportunityScanner {
  /**
   * @param {ethers.Provider} provider
   */
  constructor(provider) {
    this.provider = provider;
    this.arbContract = config.arbitrageContract
      ? new ethers.Contract(config.arbitrageContract, ARBITRAGE_ABI, provider)
      : null;
  }

  /**
   * Scans all configured token pairs for arbitrage opportunities
   * @returns {Promise<Opportunity[]>} Profitable opportunities sorted by profit desc
   */
  async scan() {
    const results = await Promise.allSettled(
      config.tokenPairs.map((pair) => this._checkPair(pair))
    );

    const opportunities = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        opportunities.push(result.value);
      }
    }

    // Sort by expected profit descending
    return opportunities.sort((a, b) =>
      b.expectedProfit > a.expectedProfit ? 1 : -1
    );
  }

  /**
   * @private
   * @param {typeof config.tokenPairs[0]} pair
   * @returns {Promise<Opportunity|null>}
   */
  async _checkPair(pair) {
    try {
      let expectedProfit, fee;

      if (this.arbContract) {
        // Use on-chain simulation (more accurate)
        [expectedProfit, fee] = await this.arbContract.simulateProfit(
          pair.asset,
          pair.loanAmount,
          pair.dexA,
          pair.dexB,
          pair.tokenB
        );
      } else {
        // Off-chain price comparison fallback
        ({ expectedProfit, fee } = await this._offChainSimulate(pair));
      }

      if (expectedProfit <= 0n) return null;
      if (expectedProfit < config.minProfitWei) return null;

      return {
        label: pair.label,
        asset: pair.asset,
        tokenB: pair.tokenB,
        dexA: pair.dexA,
        dexB: pair.dexB,
        loanAmount: pair.loanAmount,
        expectedProfit,
        fee,
      };
    } catch (err) {
      console.warn(`[Scanner] Failed to check pair ${pair.label}:`, err.message);
      return null;
    }
  }

  /**
   * @private
   * Off-chain simulation using getAmountsOut calls
   */
  async _offChainSimulate(pair) {
    const routerA = new ethers.Contract(pair.dexA, ROUTER_ABI, this.provider);
    const routerB = new ethers.Contract(pair.dexB, ROUTER_ABI, this.provider);

    // Aave V3 flashloan fee = 0.05%
    const fee = (pair.loanAmount * 5n) / 10000n;

    const amountsA = await routerA.getAmountsOut(pair.loanAmount, [
      pair.asset,
      pair.tokenB,
    ]);
    const tokenBAmount = amountsA[amountsA.length - 1];

    const amountsB = await routerB.getAmountsOut(tokenBAmount, [
      pair.tokenB,
      pair.asset,
    ]);
    const assetReceived = amountsB[amountsB.length - 1];

    const totalDebt = pair.loanAmount + fee;
    const expectedProfit =
      assetReceived > totalDebt ? assetReceived - totalDebt : 0n;

    return { expectedProfit, fee };
  }
}
