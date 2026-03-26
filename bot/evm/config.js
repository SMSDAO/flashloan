// bot/evm/config.js — Centralised configuration loader
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from repo root if present
try {
  const envPath = resolve(__dirname, '../../.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env not required; environment variables may be set externally
}

export const config = {
  // RPC
  rpcUrl: process.env.EVM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_KEY',
  flashbotsRelayUrl: process.env.FLASHBOTS_RELAY_URL || 'https://relay.flashbots.net',

  // Contracts
  arbitrageContract: process.env.ARBITRAGE_CONTRACT_ADDRESS || '',
  uniswapV2Router: process.env.UNISWAP_V2_ROUTER || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  sushiswapRouter: process.env.SUSHISWAP_ROUTER || '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',

  // Wallet
  privateKey: process.env.BOT_PRIVATE_KEY || '',
  flashbotsSignerKey: process.env.FLASHBOTS_SIGNER_KEY || '',

  // Arbitrage parameters
  minProfitWei: BigInt(process.env.MIN_PROFIT_WEI || '1000000000000000'), // 0.001 ETH
  maxGasPriceGwei: Number(process.env.MAX_GAS_PRICE_GWEI || '50'),
  scanIntervalMs: Number(process.env.SCAN_INTERVAL_MS || '5000'),
  maxRetries: Number(process.env.MAX_RETRIES || '3'),
  retryDelayMs: Number(process.env.RETRY_DELAY_MS || '1000'),

  // Token pairs to monitor (asset, intermediary, dexA, dexB)
  tokenPairs: [
    {
      asset: process.env.USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      tokenB: process.env.WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      dexA: process.env.UNISWAP_V2_ROUTER || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      dexB: process.env.SUSHISWAP_ROUTER || '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      loanAmount: BigInt(process.env.LOAN_AMOUNT_USDC || '1000000000000'), // 1M USDC (6 decimals)
      label: 'USDC/WETH Uni-Sushi',
    },
    {
      asset: process.env.WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      tokenB: process.env.USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      dexA: process.env.SUSHISWAP_ROUTER || '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      dexB: process.env.UNISWAP_V2_ROUTER || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      loanAmount: BigInt(process.env.LOAN_AMOUNT_WETH || '100000000000000000000'), // 100 WETH (18 decimals)
      label: 'WETH/USDC Sushi-Uni',
    },
  ],
};
