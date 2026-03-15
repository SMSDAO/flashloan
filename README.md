# Solana Flashloan Arbitrage System v2.0.0

> Production-grade Solana flashloan arbitrage platform with real-time monitoring, MEV bundles, multi-provider support, and a full Neo Glow UI.

## Test Status

| Suite | Tests | Status |
|-------|-------|--------|
| Backend | 13 | ✅ Passing |
| Frontend | 8 | ✅ Passing |
| **Total** | **21** | **✅ All Passing** |

## Features

- ⚡ **Solana Flashloans** — Multi-provider arbitrage (Raydium, Orca, Jupiter, Meteora)
- 🤖 **Arbitrage Bots** — Turbo, Ninja, and Sniper strategies
- 🔥 **Jito MEV Bundles** — Priority execution with retry and backoff
- 📊 **Real-time Dashboard** — Neo Glow UI with live socket updates
- 💼 **Wallet Management** — Deposit and withdraw with full transaction history
- 🗄️ **SQLite Database** — Persistent storage for transactions, profits, and analytics
- 📈 **Analytics** — Live profit tracking, execution history, and scoring
- 🔒 **Security** — Request signing, rate limiting, origin validation, timing-safe comparison
- 🚀 **One-click Deploy** — Vercel (frontend) + VPS (backend) ready
- 🖥️ **Desktop Admin** — Tauri-based admin with encrypted key storage

## Architecture

```
flashloan/
├── backend/           # Node.js + Express + Socket.IO API server
│   ├── index.js       # Main server with all REST endpoints
│   ├── database.js    # SQLite data persistence layer
│   ├── solana.js      # Solana RPC, flashloan execution, Jito bundles
│   ├── config.js      # RPC + security configuration
│   ├── validation.js  # Request validation middleware
│   └── tests/         # Backend test suite (13 tests)
├── frontend/          # Next.js 15 + React 18 UI
│   ├── pages/         # App pages (dashboard, wallet, flashloan, analytics…)
│   ├── components/    # Reusable UI components
│   └── tests/         # Frontend test suite (8 tests)
├── programs/          # Solana Anchor smart contract
├── desktop-admin/     # Tauri desktop admin app
└── scripts/           # Setup and deployment scripts
```

## Quick Start

### Prerequisites

- Node.js ≥ 24.0.0
- npm ≥ 11.0.0

### 1. Clone and install

```sh
git clone https://github.com/SMSDAO/flashloan.git
cd flashloan
npm run setup
```

### 2. Configure environment

```sh
cp .env.example .env
# Edit .env with your RPC endpoints and keys
```

Or use the auto-setup script to generate a secure `.env`:

```sh
npm run setup:env
```

### 3. Start development servers

```sh
# Start both backend and frontend
npm run dev

# Backend only (port 4000)
npm run dev:backend

# Frontend only (port 3000)
npm run dev:frontend
```

### 4. Run tests

```sh
npm test              # Run all tests
cd backend && npm test   # Backend only (13 tests)
cd frontend && npm test  # Frontend only (8 tests)
```

## API Endpoints

### Health & Status
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (RPC status) |
| GET | `/api/status` | Backend version and features |

### Flashloan
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/flashloan/execute` | Execute flashloan arbitrage |
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
| GET | `/strategies` | Available strategies |
| GET | `/analytics` | Aggregated analytics summary |
| GET | `/scoring` | Liquidity and volume scores |
| GET | `/cycle` | Workflow cycle status |

### Example: Deposit

```sh
curl -X POST http://localhost:4000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -d '{"wallet":"<your-wallet>","amount":1.5,"token":"SOL"}'
```

### Example: Execute Flashloan

```sh
curl -X POST http://localhost:4000/api/flashloan/execute \
  -H "Content-Type: application/json" \
  -d '{"wallet":"<wallet>","amount":100,"providers":["Raydium","Orca"]}'
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

The backend uses SQLite (via `better-sqlite3`) for zero-config persistent storage.

**Tables:**
- `transactions` — All flashloan and bot executions
- `wallet_operations` — Deposit and withdraw history
- `analytics_events` — Audit trail of all events
- `profit_events` — Profit tracking per execution

The database file is stored at `backend/data/flashloan.db` (configurable via `DB_PATH` env var).

## Environment Variables

```env
# Backend
NODE_ENV=development
PORT=4000
DB_PATH=./data/flashloan.db

# Solana
SOLANA_NETWORK=devnet
PROGRAM_ID=<your-program-id>
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
QUICKNODE_RPC_URL=https://your-endpoint.solana-devnet.quiknode.pro/TOKEN/

# Security
ADMIN_API_KEY=<generated-by-setup-script>
SIGNING_SECRET=<generated-by-setup-script>
ALLOWED_ORIGINS=http://localhost:3000

# Frontend
NEXT_PUBLIC_BACKEND_URL=   # Empty = relative path (works with Vercel rewrites)
```

## Deployment

### Vercel (Frontend)

```sh
npm run deploy:vercel
# or
vercel --prod
```

The `vercel.json` rewrites `/api/*` to your backend URL automatically.

### VPS (Backend)

```sh
# Install PM2
npm install -g pm2

# Start backend
cd backend && pm2 start index.js --name flashloan-backend

# Restart on reboot
pm2 startup && pm2 save
```

### Docker (optional)

```sh
docker-compose up -d
```

### One-click Setup Script

```sh
./scripts/setup-env.sh   # Generate secure .env
npm run setup             # Install all dependencies
npm start                 # Start everything
```

## Smart Contract (Solana Anchor)

The flashloan arbitrage program is in `programs/flashloan-arbitrage/`.

```sh
# Build
npm run build:program

# Deploy to devnet
npm run deploy:devnet

# Deploy to mainnet
npm run deploy:mainnet
```

## Security

- **Rate limiting** — Per-IP request limits on all endpoints
- **Origin validation** — Allowlist-based CORS (configurable)
- **Request signing** — HMAC-SHA256 signature validation for critical endpoints
- **Timing-safe comparison** — Prevents timing attacks on API key checks
- **Replay protection** — 5-minute timestamp window on signed requests
- **Encrypted key storage** — Desktop admin uses AES-256 + PBKDF2

See [SECURITY_ADVISORY.md](SECURITY_ADVISORY.md) for the full security audit.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push and open a PR

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for the Solana DeFi community*

