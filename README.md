# Flashloan Arbitrage System v3.0.0

> ⚠️ **v3.0.0 is a breaking change release.** Node.js ≥ 22 is now required, `via_ir` is enabled in all Solidity compilation, `remappings.txt` has been removed, and five new EVM environment variables are mandatory. See [CHANGELOG.md](CHANGELOG.md#300---2026-03-26) for full migration notes.

Production-grade dual-chain (Solana + EVM/Ethereum) flashloan arbitrage platform with real-time monitoring, MEV protection, and a full Neo Glow UI.

## Test Status

| Suite | Tests | Status |
|-------|-------|--------|
| Backend | 18 | ✅ Passing |
| Frontend | 8 | ✅ Passing |
| Foundry (Solidity) | CI | ✅ Passing |
| **Total (JS)** | **26** | **✅ All Passing** |

## What's New in v3.0.0

- 🔷 **EVM Flashloan Contract** (`contracts/FlashloanArbitrage.sol`) — Aave V3 + dual-DEX arbitrage with on-chain profitability invariants
- 🤖 **EVM Arbitrage Bot** (`bot/evm/`) — ethers.js v6 scan → simulate → execute loop with Flashbots MEV protection
- 🧪 **Foundry Test Suite** (`tests/foundry/`) — unit, fuzz, invariant, and mainnet fork tests
- 🔬 **Slither Static Analysis** — automated security scanning in CI
- ⚙️ **`via_ir: true`** — IR-based Solidity compilation for complex contracts

## Features

### Solana (existing)
- ⚡ **Solana Flashloans** — Multi-provider arbitrage (Raydium, Orca, Jupiter, Meteora)
- 🔥 **Jito MEV Bundles** — Priority execution with exponential-backoff retry
- 📊 **Real-time Dashboard** — Neo Glow UI with live socket updates
- 💼 **Wallet Management** — Deposit/withdraw with full transaction history
- 🗄️ **SQLite Persistence** — Zero-config storage for transactions, profits, analytics
- 🖥️ **Desktop Admin** — Tauri-based app with AES-256 encrypted key storage

### EVM / Ethereum (new in v3)
- 🔷 **Aave V3 Flashloans** — `FlashloanArbitrage.sol` implements `IFlashLoanSimpleReceiver`
- 🔄 **Dual-DEX Arbitrage** — Uniswap V2 router interface; configurable DEX pair per execution
- 🛡️ **On-chain Safety** — `ReentrancyGuard`, `Pausable`, `Ownable`, `SafeERC20`
- 📐 **Profitability Invariants** — contract reverts and returns funds if profit < threshold
- 🔭 **Pre-screening View** — `simulateProfit()` lets the bot validate off-chain before committing gas
- 🕵️ **Flashbots Bundles** — native `eth_sendBundle` JSON-RPC; no front-running, no sandwich attacks
- ⛽ **Gas Guard** — execution skipped if `expectedProfit ≤ gasEstimate × maxFeePerGas`

## Architecture

```
flashloan/
├── backend/                   # Node.js + Express + Socket.IO API server
│   ├── index.js               # REST endpoints + Socket.IO events
│   ├── database.js            # SQLite persistence (better-sqlite3)
│   ├── solana.js              # Solana RPC, flashloan execution, Jito bundles
│   ├── config.js              # RPC + security configuration
│   ├── validation.js          # Request validation middleware
│   └── tests/                 # Backend test suite (18 tests)
├── frontend/                  # Next.js 15 + React 18 Neo Glow UI
│   ├── pages/                 # Dashboard, wallet, flashloan, analytics, …
│   ├── components/            # Reusable UI components
│   └── tests/                 # Frontend test suite (8 tests)
├── contracts/                 # Solidity smart contracts (EVM)
│   ├── FlashloanArbitrage.sol # Aave V3 flashloan + dual-DEX arbitrage
│   └── interfaces/
│       └── IArbitrage.sol     # Typed interface for integrators
├── tests/
│   └── foundry/               # Foundry test suite (unit/fuzz/invariant/fork)
│       ├── FlashloanArbitrage.t.sol
│       └── FlashloanArbitrage.fork.t.sol
├── bot/
│   └── evm/                   # EVM arbitrage bot (ethers.js v6)
│       ├── index.js           # Scan → simulate → execute loop
│       ├── config.js          # Runtime config from environment
│       ├── scanner.js         # Multi-DEX opportunity scanner
│       ├── simulator.js       # On-chain simulateProfit() call
│       ├── executor.js        # Transaction builder + gas strategy
│       └── flashbots.js       # Flashbots eth_sendBundle submission
├── programs/                  # Solana Anchor smart contract
├── desktop-admin/             # Tauri desktop admin application
├── config/
│   ├── networks.json          # EVM network registry
│   └── tokens.json            # EVM token registry
├── audit/                     # Security audit artefacts
├── foundry.toml               # Foundry project config (remappings inline)
├── hardhat.config.js          # Hardhat config (viaIR: true)
└── .github/workflows/main.yml # CI/CD (build-test + foundry-test + slither)
```

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | **≥ 22.10.0 LTS** ⚠️ (Hardhat v3 requirement) |
| npm | ≥ 10 |
| Foundry | nightly (install via `foundryup`) |
| Solidity | 0.8.19 (managed by Foundry/Hardhat) |

## Quick Start

### 1. Clone and install

```sh
git clone https://github.com/SMSDAO/flashloan.git
cd flashloan
npm run setup          # installs all workspace dependencies
```

### 2. Configure environment

```sh
cp .env.example .env
# Edit .env — minimum required:
#   Solana:  HELIUS_RPC_URL, ADMIN_API_KEY, SIGNING_SECRET
#   EVM:     EVM_RPC_URL, ARBITRAGE_CONTRACT_ADDRESS, BOT_PRIVATE_KEY
```

### 3. Start development servers

```sh
npm run dev            # Backend (port 4000) + Frontend (port 3000)
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
```

### 4. Run tests

```sh
npm test                          # All JS tests (26 tests)
cd backend && npm test            # Backend only (18 tests)
cd frontend && npm test           # Frontend only (8 tests)
forge test --match-path "tests/foundry/FlashloanArbitrage.t.sol" -v   # Foundry
```

## Smart Contracts (EVM)

### FlashloanArbitrage.sol

```
contracts/FlashloanArbitrage.sol
```

**Key design decisions**:
- `ReentrancyGuard` is applied to `executeFlashloan` (public entry point) **only** — the Aave callback `executeOperation` is deliberately unguarded because Aave itself calls back into the contract, so guarding it would deadlock the call stack.
- `Pausable` lets the owner halt new flashloans without affecting in-flight executions.
- Profitability is enforced on-chain with three chained invariants so the contract can never be used to drain funds at a loss.

**Public interface**:

| Function | Access | Description |
|----------|--------|-------------|
| `executeFlashloan(asset, amount, dexA, dexB, tokenB, minProfit)` | `onlyOwner` `nonReentrant` `whenNotPaused` | Initiates flashloan arbitrage |
| `executeOperation(asset, amount, premium, initiator, params)` | Aave callback | Executes arbitrage and repays loan |
| `simulateProfit(asset, amount, dexA, dexB, tokenB)` | `view` | Off-chain pre-screening |
| `setMinProfit(newMinProfit)` | `onlyOwner` | Update profit threshold |
| `pause()` / `unpause()` | `onlyOwner` | Circuit breaker |
| `emergencyWithdraw(token, to)` | `onlyOwner` `whenPaused` | Recover stuck tokens |

**Events**:

| Event | Description |
|-------|-------------|
| `FlashloanExecuted(asset, amount, premium, profit)` | Emitted on successful flashloan |
| `ArbitrageCompleted(dexA, dexB, asset, amountIn, amountOut)` | Emitted on successful swap pair |
| `MinProfitUpdated(oldMinProfit, newMinProfit)` | Emitted on threshold change |
| `EmergencyWithdraw(token, amount, to)` | Emitted on emergency withdrawal |

### Build and deploy

```sh
# Build (Foundry)
forge build --sizes

# Run tests
forge test -v
forge coverage --match-path "tests/foundry/FlashloanArbitrage.t.sol" --report lcov

# Deploy (Hardhat — coming soon: deploy scripts)
npx hardhat compile
```

## EVM Arbitrage Bot

### How it works

```
┌─────────────────────────────────────────────────────┐
│  Every SCAN_INTERVAL_MS milliseconds:               │
│                                                     │
│  1. SCAN   — getAmountsOut on dexA and dexB         │
│             for each configured token pair          │
│  2. FILTER — discard if spread < MIN_PROFIT_WEI     │
│  3. SIMULATE — call simulateProfit() on-chain       │
│             (reverts if unprofitable at this block) │
│  4. GAS CHECK — skip if profit ≤ gas × maxFeePerGas │
│  5. EXECUTE — submit via Flashbots bundle           │
│             (or public mempool if key unavailable)  │
└─────────────────────────────────────────────────────┘
```

### Run the bot

```sh
cd bot/evm
npm install
# Set EVM_RPC_URL, ARBITRAGE_CONTRACT_ADDRESS, BOT_PRIVATE_KEY in ../../.env
npm start
```

### Bot environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EVM_RPC_URL` | ✅ | Ethereum JSON-RPC endpoint |
| `ARBITRAGE_CONTRACT_ADDRESS` | ✅ | Deployed `FlashloanArbitrage` address |
| `BOT_PRIVATE_KEY` | ✅ | Wallet private key (hex, without `0x`) |
| `FLASHBOTS_SIGNER_KEY` | Optional | Flashbots auth key; enables bundle submission |
| `FLASHBOTS_RELAY_URL` | Optional | Defaults to `https://relay.flashbots.net` |
| `UNISWAP_V2_ROUTER` | Optional | Defaults to mainnet address |
| `SUSHISWAP_ROUTER` | Optional | Defaults to mainnet address |
| `MIN_PROFIT_WEI` | Optional | Defaults to `1000000000000000` (0.001 ETH) |
| `MAX_GAS_PRICE_GWEI` | Optional | Defaults to `50` |
| `SCAN_INTERVAL_MS` | Optional | Defaults to `5000` |

## Solana Backend API

### Health & Status
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (RPC status) |
| GET | `/api/status` | Backend version and features |

### Flashloan
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/flashloan/execute` | Execute Solana flashloan arbitrage |
| POST | `/api/jito/bundle` | Submit Jito MEV bundle |
| GET | `/api/logs/:executionId` | Get execution logs |
| GET | `/api/profits` | Get all profit events |
| GET | `/api/profits/history` | Get profit history (last N hours) |

### Wallet
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wallet/:address` | Get wallet balance and history |
| POST | `/api/wallet/deposit` | Deposit funds |
| POST | `/api/wallet/withdraw` | Withdraw funds |
| GET | `/api/transactions` | Get transaction history |

### Bots & Market
| Method | Path | Description |
|--------|------|-------------|
| GET | `/bots` | List all bots |
| POST | `/api/bots/execute` | Execute bot strategy |
| GET | `/market` | Market data (pools, TVL) |
| GET | `/tokens` | Token prices and changes |
| GET | `/analytics` | Aggregated analytics summary |
| GET | `/scoring` | Liquidity and volume scores |

### Example: Execute Flashloan (Solana)

```sh
curl -X POST http://localhost:4000/api/flashloan/execute \
  -H "Content-Type: application/json" \
  -d '{"wallet":"<wallet>","amount":100,"providers":["Raydium","Orca"]}'
```

### Example: Deposit

```sh
curl -X POST http://localhost:4000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -d '{"wallet":"<your-wallet>","amount":1.5,"token":"SOL"}'
```

## Frontend Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing page with wallet connect |
| Dashboard | `/dashboard` | Bot execution and live stats |
| Wallet | `/wallet` | Deposit, withdraw, transaction history |
| Flashloan | `/flashloan` | Execute flashloan via socket |
| Analytics | `/analytics` | Profit charts and metrics |
| Arbitrage | `/arbitrage` | Arbitrage opportunities |
| Market | `/market` | Market data and pools |
| Tokens | `/tokens` | Token prices |
| Scoring | `/scoring` | Risk and liquidity scoring |
| Admin | `/admin` | Admin controls |
| Profile | `/profile` | User profile |

## Database

SQLite via `better-sqlite3` — zero-config persistent storage.

**Tables:**
- `transactions` — All flashloan and bot executions
- `wallet_operations` — Deposit and withdraw history
- `analytics_events` — Audit trail of all events
- `profit_events` — Profit tracking per execution
- `wallet_balances` — Current balance per address (updated atomically)

Database file: `backend/data/flashloan.db` (override via `DB_PATH` env var).

## Environment Variables

```env
# ── Core ──────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=4000

# ── Solana ───────────────────────────────────────────────────────────────────
SOLANA_NETWORK=devnet
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
ADMIN_API_KEY=<openssl rand -hex 32>
SIGNING_SECRET=<openssl rand -hex 32>
ALLOWED_ORIGINS=http://localhost:3000

# ── EVM (new in v3) ──────────────────────────────────────────────────────────
EVM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
ARBITRAGE_CONTRACT_ADDRESS=           # set after deployment
BOT_PRIVATE_KEY=                      # NEVER commit
FLASHBOTS_SIGNER_KEY=                 # optional, enables MEV protection
MAINNET_RPC_URL=                      # optional, for Foundry fork tests
```

See [`.env.example`](.env.example) for the complete annotated reference.

## CI/CD Pipeline

| Job | What it does |
|-----|-------------|
| `build-test` | Install → build backend + frontend → run all JS tests → Hardhat compile |
| `foundry-test` | Foundry nightly → forge build → forge test → forge coverage |
| `slither-security` | Slither static analysis (`--exclude-informational`, `continue-on-error`) |

All jobs run on Node.js 22 (LTS). Fork tests auto-skip when `MAINNET_RPC_URL` is not set.

## Deployment

### Vercel (Frontend)

```sh
vercel --prod
# vercel.json rewrites /api/* to your backend URL automatically
```

### VPS (Backend)

```sh
npm install -g pm2
cd backend && pm2 start index.js --name flashloan-backend
pm2 startup && pm2 save
```

### EVM Contract

```sh
# Compile
npx hardhat compile        # or: forge build

# Deploy (add deploy script or use Hardhat Ignition)
# Set ARBITRAGE_CONTRACT_ADDRESS in .env after deployment
```

### Docker (optional)

```sh
docker-compose up -d
```

## Security

| Control | Description |
|---------|-------------|
| **On-chain ReentrancyGuard** | Entry-point guard prevents recursive flashloan calls |
| **On-chain Pausable** | Emergency circuit breaker halts new executions |
| **Profitability invariants** | Contract reverts and returns funds if profit < threshold |
| **Flashbots bundles** | EVM transactions submitted via private relay — no front-running |
| **Gas guard** | Bot refuses to execute if `profit ≤ gas × maxFeePerGas` |
| **Rate limiting** | Per-IP request limits on all Solana API endpoints |
| **Origin validation** | Allowlist-based CORS (configurable) |
| **HMAC-SHA256 signing** | Request signing for critical API endpoints |
| **Timing-safe comparison** | Prevents timing attacks on API key checks |
| **Replay protection** | 5-minute timestamp window on signed requests |
| **Encrypted key storage** | Desktop admin uses AES-256 + PBKDF2 |

See [SECURITY_ADVISORY.md](SECURITY_ADVISORY.md) for the full security audit.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push and open a PR

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built for the Solana and Ethereum DeFi communities.*

