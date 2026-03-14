# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
