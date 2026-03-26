// bot/evm/simulator.js — Pre-execution simulation engine
import { ethers } from 'ethers';

const ARBITRAGE_ABI = [
  'function simulateProfit(address asset, uint256 amount, address dexA, address dexB, address tokenB) external view returns (uint256 expectedProfit, uint256 fee)',
  'function executeFlashloan(address asset, uint256 amount, address dexA, address dexB, address tokenB, uint256 minProfit) external',
];

/**
 * Simulates a flashloan arbitrage call using eth_call to detect revert reasons
 * and estimate gas before sending the real transaction.
 */
export class Simulator {
  /**
   * @param {ethers.Provider} provider
   * @param {string} contractAddress
   * @param {string} ownerAddress
   */
  constructor(provider, contractAddress, ownerAddress) {
    this.provider = provider;
    this.contract = new ethers.Contract(contractAddress, ARBITRAGE_ABI, provider);
    this.ownerAddress = ownerAddress;
  }

  /**
   * Simulates execution and returns estimated gas + profit validation
   * @param {import('./scanner.js').Opportunity} opportunity
   * @returns {Promise<{success: boolean, gasEstimate: bigint, reason?: string}>}
   */
  async simulate(opportunity) {
    try {
      // 1. On-chain profit check
      const [profit] = await this.contract.simulateProfit(
        opportunity.asset,
        opportunity.loanAmount,
        opportunity.dexA,
        opportunity.dexB,
        opportunity.tokenB
      );

      if (profit <= 0n) {
        return { success: false, gasEstimate: 0n, reason: 'Simulation: zero profit' };
      }

      // 2. Gas estimation (calls executeFlashloan via eth_estimateGas)
      const gasEstimate = await this.contract.executeFlashloan.estimateGas(
        opportunity.asset,
        opportunity.loanAmount,
        opportunity.dexA,
        opportunity.dexB,
        opportunity.tokenB,
        opportunity.expectedProfit,
        { from: this.ownerAddress }
      );

      return { success: true, gasEstimate, profit };
    } catch (err) {
      return {
        success: false,
        gasEstimate: 0n,
        reason: err.message || 'Simulation failed',
      };
    }
  }
}
