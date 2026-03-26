# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-03-26

> ⚠️ **Breaking change** — This release introduces an EVM/Ethereum execution layer alongside the existing Solana stack. Deployment, environment variables, and the CI pipeline have all changed. Review the migration notes below before upgrading.

### Breaking Changes

- **New runtime requirement**: Node.js ≥ 22.10.0 is now required (upgraded from ≥ 20.x; Hardhat v3 requires Node 22). Update `node-version` in any local CI or deployment scripts accordingly.
- **`foundry.toml` is now canonical for Solidity remappings** — `remappings.txt` has been removed. If you had local tooling reading `remappings.txt` directly, update it to read from `foundry.toml`.
- **`via_ir: true` enabled for all Solidity compilation** (both Foundry and Hardhat). Compilation artefacts produced by earlier toolchains are not compatible; run `forge clean` and `npx hardhat clean` before rebuilding.
- **New mandatory environment variables** for EVM operation (see `.env.example`):
  - `EVM_RPC_URL` — Ethereum JSON-RPC endpoint
  - `ARBITRAGE_CONTRACT_ADDRESS` — deployed `FlashloanArbitrage` contract address
  - `BOT_PRIVATE_KEY` — operator wallet private key (hex, without `0x`)
  - `FLASHBOTS_SIGNER_KEY` — Flashbots relay signing key (optional; enables MEV bundle submission)
  - `MAINNET_RPC_URL` — optional, used by Foundry fork tests

### Added

#### Smart Contracts (`/contracts`)
- **`FlashloanArbitrage.sol`** — Aave V3 `IFlashLoanSimpleReceiver` + dual-DEX arbitrage (Uniswap V2 router interface).
  - `ReentrancyGuard` on public entry point (`executeFlashloan`) only; callback (`executeOperation`) intentionally unguarded to avoid Aave call-stack deadlock.
  - `Pausable` circuit breaker: owner can halt new flashloans without affecting in-flight executions.
  - `Ownable` admin gates on `pause`/`unpause`, `setMinProfit`, `emergencyWithdraw`.
  - `SafeERC20` for all token transfers.
  - On-chain profitability invariants: `assetReceived ≥ totalDebt`, `profit ≥ minProfit`, `finalBalance ≥ initialBalance + premium`.
  - `simulateProfit(asset, amount, dexA, dexB, tokenB)` view function for off-chain pre-screening.
  - `MinProfitUpdated(uint256 old, uint256 new)` event emitted on threshold changes.
- **`contracts/interfaces/IArbitrage.sol`** — typed interface for external integrators.
- **`contracts/README.md`** — contract-level NatSpec and architecture notes.

#### Tests (`/tests/foundry`)
- Foundry test suite (`FlashloanArbitrage.t.sol`):
  - Unit tests: constructor, ownership, pause/unpause, `setMinProfit`, `emergencyWithdraw`, event emissions.
  - Integration tests: profitable path end-to-end, unprofitable revert, below-min-profit revert, reentrancy guard.
  - Fuzz tests: `executeFlashloan` with random amounts and profit thresholds.
  - Invariant tests: contract balance never decreases during arbitrage.
  - Fork tests (auto-skipped if `MAINNET_RPC_URL` is unset): live Aave V3 + Uniswap V2 round-trip.
- `FlashloanArbitrage.fork.t.sol` — live-network fork test with real Aave V3 pool addresses.

#### Bot (`/bot/evm`)
- **`scanner.js`** — multi-DEX `getAmountsOut` price comparison; selects the most profitable pair per block.
- **`simulator.js`** — calls `simulateProfit()` on-chain before committing gas.
- **`executor.js`** — submits `executeFlashloan` via `ethers.js` v6; aborts if `maxFeePerGas` is unavailable.
- **`flashbots.js`** — MEV protection via native Flashbots JSON-RPC (`eth_sendBundle`); does not depend on `@flashbots/ethers-provider-bundle` (ethers v5 only).
- **`index.js`** — main scan → simulate → execute loop with configurable polling interval.
- **`config.js`** — centralised runtime configuration validated at startup.
- Gas cost guard: execution is skipped when `expectedProfit ≤ gasEstimate × maxFeePerGas`.

#### Infrastructure
- **`foundry.toml`** — Foundry project configuration with inline remappings (no `remappings.txt`).
- **`config/networks.json`** — network registry (Ethereum mainnet, Sepolia, Polygon, Arbitrum, Base).
- **`config/tokens.json`** — EVM token registry (WETH, USDC, USDT, DAI, WBTC) with decimals and checksummed addresses.
- **`audit/baseline.json`** — Slither baseline snapshot.
- **`audit/diff-report.md`** — audit diff report.
- **`audit/pr-status.md`** — PR-level audit status tracker.
- `@openzeppelin/contracts@^4.9.6` added to root `devDependencies` for Hardhat resolution.

#### CI/CD (`.github/workflows/main.yml`)
- `foundry-test` job: installs Foundry nightly → OZ contracts + forge-std → `forge build --sizes` → `forge test` → `forge coverage`.
- `slither-security` job: static analysis with `--exclude-informational`; `continue-on-error: true` to avoid blocking on informational findings.
- Both new jobs carry explicit `permissions: contents: read`.
- Node.js version upgraded to 22 in `build-test` to satisfy Hardhat v3's iterator API requirements.

### Changed
- **`hardhat.config.js`** — `viaIR: true` added to Solidity compiler settings (required to compile `FlashloanArbitrage.sol` without stack-overflow errors).
- **`foundry.toml`** — `via_ir` changed to `true`; remappings moved inline from the now-deleted `remappings.txt`.
- **`.github/workflows/main.yml`** — `node-version` bumped from `20.9` to `22`.
- **`README.md`** — updated to document the full dual-chain (Solana + EVM) architecture, new prerequisites, environment variables, and deployment paths.
- **`CHANGELOG.md`** — this entry.

### Removed
- **`remappings.txt`** — Hardhat v3 was intercepting these remappings and routing `@openzeppelin/contracts/` to a non-existent `lib/` directory. Remappings are now embedded in `foundry.toml`.

### Security
- All on-chain fund movements guarded by profitability invariants; contract reverts and returns funds to Aave if any check fails.
- `ReentrancyGuard` on the public flashloan entry point prevents recursive calls from compromised DEX adapters.
- `emergencyWithdraw` callable only when contract is paused and only by owner.
- Off-chain bot refuses to sign transactions when `maxFeePerGas` is unavailable — prevents accidental zero-gas-price submissions.
- Flashbots bundle submission eliminates front-running and sandwich attack vectors.

### Migration Notes

1. **Upgrade Node.js** to 22.x LTS on all developer machines and CI runners.
2. Run `forge clean && forge build` and `npx hardhat clean && npx hardhat compile` to regenerate artefacts with `via_ir` enabled.
3. Copy the new EVM variables from `.env.example` into your `.env`.
4. Deploy `FlashloanArbitrage.sol` via Hardhat or Forge scripts; set `ARB_CONTRACT_ADDRESS` to the resulting address.
5. Fund the operator wallet with ETH for gas; the contract itself is gas-neutral (borrows and repays in the same transaction).

---

## [2.0.0] - 2026-03-14

### Added
- **Reentrancy guard** in `executeFlashloan` — concurrent executions for the same wallet are now rejected to prevent double-spend conditions.
- **Minimum profit enforcement** — `minProfit` parameter is now validated after profit calculation; executions that fall below the threshold return a `skipped` status instead of proceeding.
- **WebSocket `subscribePool` input validation** — pool addresses are validated as valid Solana base58 public keys (32–44 characters) before being passed to `startPoolListener`. Invalid addresses return a `subscribeError` event.
- **WebSocket pool listener cleanup on disconnect** — each socket's pool subscriptions are tracked and deactivated on `disconnect` to prevent stale emissions to closed sockets.
- **`SIGNING_SECRET` environment variable** added to `.env.example` with documentation; used for HMAC-SHA256 API request signing.
- **User Dashboard** (`/user`) — full Neo Glow / Glassmorphism UI with profile banner, stats grid (profit, executions, balance, active bots), recent activity table, notifications panel, and account settings.
- **Admin Dashboard** (`/admin`) — full tabbed Neo Glow / Glassmorphism UI with Overview (system stats, service status), User Management (RBAC roles, suspend/edit), Audit Trail, and System Configuration panels.
- **Structured logging** via `EventLogger` with categories: `flashloan`, `jito`, `profit_event`, `rpc`, `health_check`, `transaction`.
- **Jito MEV bundle retry** with 3 attempts, exponential backoff, and automatic fallback to standard transactions.
- **RPC fallback system** — rotates through premium (Helius, QuickNode, Triton, Alchemy) then public RPC endpoints on failure.

### Changed
- `executeFlashloan` refactored to separate outer guard function and `_executeFlashloanInner` for clean reentrancy protection.
- `CoreDashboardLayout` navigation updated to include all primary routes.
- `.env.example` now documents all required and optional secrets including `SIGNING_SECRET`.

### Fixed
- `minProfit` parameter was accepted but never enforced — profit threshold check is now applied before the success response is returned.
- WebSocket `subscribePool` passed unsanitised user input directly to `PublicKey` constructor — now validated before use.
- Pool listeners were never deactivated when a socket disconnected — fixed via per-socket subscription tracking.

### Security
- **Reentrancy lock** per-wallet prevents race conditions in flashloan execution.
- **WebSocket input sanitisation** prevents malformed `PublicKey` construction from user-supplied strings.
- **Constant-time comparison** (`crypto.timingSafeEqual`) retained for API key and signature verification.
- **Replay attack protection** retained — 5-minute timestamp window on signed requests.

---

## [1.0.0] - 2025-12-01

### Added
- Initial production release.
- Solana flashloan arbitrage execution with multi-provider support (Raydium, Orca, Jupiter, Meteora).
- Jito MEV bundle integration with retry and fallback.
- Dynamic fee optimisation using recent priority fee percentiles.
- Real-time pool monitoring via Solana account-change subscriptions.
- Neo Glow / Glassmorphism frontend UI built with Next.js and Tailwind CSS.
- `CoreDashboardLayout` with sidebar navigation and widget grid.
- `ExecutionTimeline`, `ProfitHeatmap`, and `WorkflowVisualizer` components.
- SQLite persistence layer (`better-sqlite3`) for transactions, wallet operations, balances, analytics events, and profit events.
- REST API: `/api/flashloan/execute`, `/api/status`, `/api/wallet/:address`, `/api/profits`, `/api/logs/:executionId`, `/health`.
- Socket.IO real-time events: `flashloanExecuted`, `poolUpdate`, `botResult`.
- Request validation middleware: origin checking, HMAC-SHA256 signature verification, rate limiting, input validation.
- Desktop admin application built with Tauri (AES-256 encrypted key storage, PBKDF2 master-password protection).
- CI/CD pipeline (`.github/workflows/main.yml`) with dependency caching, parallel install, backend + frontend tests, Hardhat contract compilation, and artifact upload.
- Full environment template (`.env.example`) with annotated defaults for all configurable parameters.
