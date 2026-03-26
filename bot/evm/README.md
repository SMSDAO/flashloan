# EVM Flashloan Arbitrage Bot

Node.js bot using ethers.js v6 for flashloan arbitrage on EVM chains.

## Architecture

```
bot/evm/
├── index.js        — Main loop: scan → simulate → execute
├── config.js       — Environment-based configuration
├── scanner.js      — Multi-DEX opportunity scanner
├── simulator.js    — Pre-execution simulation engine
├── executor.js     — Transaction executor with retry + gas strategy
└── flashbots.js    — Flashbots MEV-protection bundle submission
```

## Setup

```bash
cd bot/evm
npm install
cp ../../.env.example ../../.env
# Edit .env with your keys
npm start
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `EVM_RPC_URL` | Ethereum JSON-RPC endpoint |
| `BOT_PRIVATE_KEY` | Wallet private key for signing txs |
| `ARBITRAGE_CONTRACT_ADDRESS` | Deployed FlashloanArbitrage contract address |
| `FLASHBOTS_SIGNER_KEY` | Optional: Flashbots auth signer key |
| `MIN_PROFIT_WEI` | Minimum profit threshold in wei |
| `MAX_GAS_PRICE_GWEI` | Gas price cap in Gwei |

## MEV Protection

When `FLASHBOTS_SIGNER_KEY` is set, transactions are submitted as Flashbots bundles to prevent front-running. Without it, the bot falls back to the public mempool.
