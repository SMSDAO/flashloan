// bot/evm/index.js — Main bot entrypoint
import { ethers } from 'ethers';
import { config } from './config.js';
import { OpportunityScanner } from './scanner.js';
import { Simulator } from './simulator.js';
import { Executor } from './executor.js';
import { FlashbotsExecutor } from './flashbots.js';

// ─── Startup ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 EVM Flashloan Arbitrage Bot starting...');

  if (!config.privateKey) {
    console.error('❌ BOT_PRIVATE_KEY not set — bot cannot sign transactions');
    process.exit(1);
  }

  if (!config.arbitrageContract) {
    console.warn('⚠️  ARBITRAGE_CONTRACT_ADDRESS not set — simulation mode only');
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  const ownerAddress = await signer.getAddress();
  console.log(`👛 Bot wallet: ${ownerAddress}`);

  // Components
  const scanner = new OpportunityScanner(provider);
  const simulator = config.arbitrageContract
    ? new Simulator(provider, config.arbitrageContract, ownerAddress)
    : null;

  // MEV-protected executor
  let executor;
  if (config.arbitrageContract) {
    if (config.flashbotsSignerKey) {
      const flashbotsSigner = new ethers.Wallet(config.flashbotsSignerKey, provider);
      executor = new FlashbotsExecutor(signer, flashbotsSigner, provider);
      console.log('🛡️  Flashbots MEV protection enabled');
    } else {
      executor = new Executor(signer, config.arbitrageContract);
      console.warn('⚠️  No FLASHBOTS_SIGNER_KEY — using public mempool (no MEV protection)');
    }
  }

  // ─── Main loop ────────────────────────────────────────────────────────────
  console.log(`🔍 Scanning every ${config.scanIntervalMs}ms...`);
  let iteration = 0;

  while (true) {
    iteration++;
    const start = Date.now();

    try {
      const opportunities = await scanner.scan();

      if (opportunities.length === 0) {
        console.log(`[${new Date().toISOString()}] Iteration ${iteration}: No opportunities found`);
      } else {
        console.log(`[${new Date().toISOString()}] Iteration ${iteration}: ${opportunities.length} opportunities`);

        for (const opp of opportunities) {
          console.log(
            `  💰 ${opp.label}: profit=${ethers.formatEther(opp.expectedProfit)} ETH`
          );

          if (!simulator || !executor) {
            console.log('  ⚡ [SIMULATION MODE] Would execute but no contract/key configured');
            continue;
          }

          // Pre-execution simulation
          const { success, gasEstimate, reason } = await simulator.simulate(opp);
          if (!success) {
            console.warn(`  ⛔ Simulation failed: ${reason}`);
            continue;
          }

          // Gas cost check — skip execution if maxFeePerGas is unavailable
          const feeData = await provider.getFeeData();
          if (!feeData.maxFeePerGas) {
            console.warn('  ⛔ Cannot determine gas price — skipping execution');
            continue;
          }
          const gasCostWei = gasEstimate * feeData.maxFeePerGas;
          if (opp.expectedProfit <= gasCostWei) {
            console.warn(`  ⛔ Profit (${opp.expectedProfit}) <= gas cost (${gasCostWei})`);
            continue;
          }

          // Execute
          try {
            const result = await executor.submitBundle
              ? executor.submitBundle(opp, gasEstimate)
              : executor.execute(opp, gasEstimate);
            console.log(`  ✅ Executed: ${JSON.stringify(result)}`);
          } catch (execErr) {
            console.error(`  ❌ Execution failed: ${execErr.message}`);
          }
        }
      }
    } catch (scanErr) {
      console.error(`[Bot] Scan error: ${scanErr.message}`);
    }

    const elapsed = Date.now() - start;
    const waitMs = Math.max(0, config.scanIntervalMs - elapsed);
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
