// bot/evm/executor.js — Transaction executor with retry + gas strategy
import { ethers } from 'ethers';
import { config } from './config.js';

const ARBITRAGE_ABI = [
  'function executeFlashloan(address asset, uint256 amount, address dexA, address dexB, address tokenB, uint256 minProfit) external',
];

/**
 * Executes arbitrage transactions with retry logic and gas strategy.
 */
export class Executor {
  /**
   * @param {ethers.Signer} signer
   * @param {string} contractAddress
   */
  constructor(signer, contractAddress) {
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, ARBITRAGE_ABI, signer);
  }

  /**
   * Execute a flashloan with retry + gas bumping
   * @param {import('./scanner.js').Opportunity} opportunity
   * @param {bigint} gasEstimate
   * @returns {Promise<ethers.TransactionReceipt>}
   */
  async execute(opportunity, gasEstimate) {
    const gasLimit = (gasEstimate * 130n) / 100n; // 30% buffer

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const feeData = await this.signer.provider.getFeeData();
        const maxFeePerGas = this._cappedGas(feeData.maxFeePerGas);
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? ethers.parseUnits('1', 'gwei');

        console.log(
          `[Executor] Attempt ${attempt}/${config.maxRetries} — gas limit ${gasLimit}, maxFee ${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`
        );

        const tx = await this.contract.executeFlashloan(
          opportunity.asset,
          opportunity.loanAmount,
          opportunity.dexA,
          opportunity.dexB,
          opportunity.tokenB,
          opportunity.expectedProfit,
          { gasLimit, maxFeePerGas, maxPriorityFeePerGas }
        );

        console.log(`[Executor] TX submitted: ${tx.hash}`);
        const receipt = await tx.wait(1);
        console.log(`[Executor] TX confirmed in block ${receipt.blockNumber}`);
        return receipt;
      } catch (err) {
        console.error(`[Executor] Attempt ${attempt} failed:`, err.message);
        if (attempt < config.maxRetries) {
          await this._sleep(config.retryDelayMs * attempt);
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * Cap gas price to configured maximum
   * @param {bigint|null} price
   * @returns {bigint}
   */
  _cappedGas(price) {
    const maxWei = ethers.parseUnits(String(config.maxGasPriceGwei), 'gwei');
    if (!price) return maxWei;
    return price < maxWei ? price : maxWei;
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
