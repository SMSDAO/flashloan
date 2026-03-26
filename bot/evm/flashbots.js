// bot/evm/flashbots.js — Flashbots MEV protection integration (ethers v6 native)
//
// Implements Flashbots bundle submission by calling the Flashbots relay's
// eth_sendBundle JSON-RPC method directly. This avoids the @flashbots/ethers-provider-bundle
// package which only supports ethers v5.
//
// Reference: https://docs.flashbots.net/flashbots-auction/searchers/advanced/rpc-endpoint
import { ethers } from 'ethers';
import { config } from './config.js';

const ARBITRAGE_ABI = [
  'function executeFlashloan(address asset, uint256 amount, address dexA, address dexB, address tokenB, uint256 minProfit) external',
];

/**
 * Signs the Flashbots relay payload using EIP-191 personal_sign.
 * The relay authenticates bundles via the X-Flashbots-Signature header.
 * @param {string} body - JSON body string
 * @param {ethers.Wallet} authSigner
 * @returns {Promise<string>} "address:signature"
 */
async function signFlashbotsPayload(body, authSigner) {
  const hashedBody = ethers.id(body);
  const signature = await authSigner.signMessage(ethers.getBytes(hashedBody));
  return `${await authSigner.getAddress()}:${signature}`;
}

/**
 * Submits arbitrage transactions via Flashbots bundles for MEV protection.
 * Falls back to standard submission if Flashbots signer is not configured.
 */
export class FlashbotsExecutor {
  /**
   * @param {ethers.Wallet} signer          — Wallet signer for transactions
   * @param {ethers.Wallet|null} authSigner  — Auth signer for Flashbots reputation (optional)
   * @param {ethers.Provider} provider
   */
  constructor(signer, authSigner, provider) {
    this.signer = signer;
    this.authSigner = authSigner; // null = fall back to standard submission
    this.provider = provider;
    this.contract = new ethers.Contract(
      config.arbitrageContract,
      ARBITRAGE_ABI,
      signer
    );
  }

  /**
   * Submit an arbitrage transaction via Flashbots bundle
   * @param {import('./scanner.js').Opportunity} opportunity
   * @param {bigint} gasEstimate
   * @returns {Promise<{bundleHash?: string, txHash?: string}>}
   */
  async submitBundle(opportunity, gasEstimate) {
    if (!this.authSigner) {
      return this._submitStandard(opportunity, gasEstimate);
    }

    const block = await this.provider.getBlockNumber();
    const targetBlock = block + 1;
    const gasLimit = (gasEstimate * 130n) / 100n;
    const feeData = await this.provider.getFeeData();

    const maxFeePerGas = this._resolveMaxFee(feeData.maxFeePerGas);
    const maxPriorityFeePerGas =
      feeData.maxPriorityFeePerGas ?? ethers.parseUnits('1', 'gwei');

    // Build and sign the transaction
    const populatedTx = await this.contract.executeFlashloan.populateTransaction(
      opportunity.asset,
      opportunity.loanAmount,
      opportunity.dexA,
      opportunity.dexB,
      opportunity.tokenB,
      opportunity.expectedProfit,
      {
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        type: 2,
        chainId: (await this.provider.getNetwork()).chainId,
        nonce: await this.signer.getNonce(),
      }
    );

    const signedTx = await this.signer.signTransaction(populatedTx);

    const bundleParams = {
      txs: [signedTx],
      blockNumber: `0x${targetBlock.toString(16)}`,
    };

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendBundle',
      params: [bundleParams],
    });

    const authHeader = await signFlashbotsPayload(body, this.authSigner);

    const response = await fetch(config.flashbotsRelayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': authHeader,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Flashbots relay responded with ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(`Flashbots error: ${result.error.message}`);
    }

    const bundleHash = result.result?.bundleHash;
    console.log(
      `[Flashbots] Bundle submitted for block ${targetBlock}, hash: ${bundleHash}`
    );
    return { bundleHash };
  }

  /**
   * @private Fallback standard submission
   */
  async _submitStandard(opportunity, gasEstimate) {
    const gasLimit = (gasEstimate * 130n) / 100n;
    const feeData = await this.provider.getFeeData();
    const maxFeePerGas = this._resolveMaxFee(feeData.maxFeePerGas);
    const maxPriorityFeePerGas =
      feeData.maxPriorityFeePerGas ?? ethers.parseUnits('1', 'gwei');

    const tx = await this.contract.executeFlashloan(
      opportunity.asset,
      opportunity.loanAmount,
      opportunity.dexA,
      opportunity.dexB,
      opportunity.tokenB,
      opportunity.expectedProfit,
      { gasLimit, maxFeePerGas, maxPriorityFeePerGas }
    );
    console.log(`[Standard] TX: ${tx.hash}`);
    await tx.wait(1);
    return { txHash: tx.hash };
  }

  /**
   * @private Resolve and cap maxFeePerGas
   * @param {bigint|null} price
   * @returns {bigint}
   */
  _resolveMaxFee(price) {
    const cap = ethers.parseUnits(String(config.maxGasPriceGwei), 'gwei');
    if (!price || price === 0n) {
      // Fall back to configured cap when fee data is unavailable
      return cap;
    }
    return price < cap ? price : cap;
  }
}
