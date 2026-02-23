# Quick Start Guide

## Easy Setup (No Conflicts)

This guide helps you run the frontend and backend without conflicts or complicated configuration.

### Prerequisites

- Node.js 24+
- npm or yarn

### Option 1: Development Mode (Easiest)

**Step 1: Auto-configure environment**
```bash
./scripts/setup-env.sh
```

This creates a `.env` file with all required configuration.

**Step 2: Install dependencies**
```bash
npm run setup
```

**Step 3: Start development servers**

In one terminal (Backend):
```bash
cd backend
npm run dev
```

In another terminal (Frontend):
```bash
cd frontend
npm run dev
```

- Backend runs on: `http://localhost:4000`
- Frontend runs on: `http://localhost:3000`
- Frontend automatically connects to backend (no config needed)

### Option 2: Production Deployment (Vercel + Backend Host)

**Frontend (Vercel):**

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.com
   ```
4. Deploy! ✨

**Backend (Railway/Render/Any Host):**

1. Set environment variables from `.env.example`
2. Run: `npm start` in backend directory
3. Backend exposes:
   - `/health` - Health check
   - `/api/execute` - Execute arbitrage
   - `/api/logs/:id` - Get execution logs
   - `/api/profits` - Get profit history

### Option 3: Unified Development (Single Command)

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\"",
    "start": "npm run dev"
  }
}
```

Install concurrently:
```bash
npm install --save-dev concurrently
```

Then run:
```bash
npm run dev
```

### Environment Variables

**Frontend (.env.local)**:
```env
# Optional: Only needed for production deployment
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

**Backend (.env)**:
```env
# Required - Solana RPC endpoints
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Optional - Feature toggles
ENABLE_JITO_MEV=true
ENABLE_EXECUTION_TIMELINE=true
ENABLE_PROFIT_EVENTS=true

# Optional - Security (recommended for production)
ADMIN_API_KEY=your-secret-api-key-here
REQUIRE_AUTH=false  # Set to true in production
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

### Troubleshooting

**Problem: Frontend can't connect to backend**
- Solution: Check `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Default: Frontend connects to `http://localhost:4000` in development

**Problem: CORS errors**
- Solution: Add your frontend URL to `ALLOWED_ORIGINS` in backend `.env`

**Problem: Port already in use**
- Backend: Change `PORT` in backend/.env (default: 4000)
- Frontend: `PORT=3001 npm run dev` to use different port

**Problem: Tests failing**
- Run: `npm test` in backend and frontend directories separately
- Check Jest configuration in `jest.config.json`

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Next.js        │────────▶│  Express.js      │
│  Frontend       │  HTTP   │  Backend         │
│  (Port 3000)    │ /Socket │  (Port 4000)     │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
                                     │
                                     │
                                     ▼
                            ┌──────────────────┐
                            │                  │
                            │  Solana Network  │
                            │  (via RPC)       │
                            │                  │
                            └──────────────────┘
```

### Key Features

✅ **No Docker** - Simple npm scripts
✅ **Auto-configuration** - One command setup
✅ **No conflicts** - Separate ports for frontend/backend
✅ **Vercel-ready** - Deploy frontend in seconds
✅ **Flexible backend** - Deploy anywhere (Railway, Render, VPS)

### Next Steps

1. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
2. Read [docs/API.md](./docs/API.md) for API documentation
3. Check [docs/TESTING.md](./docs/TESTING.md) for running tests
4. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design

### Support

- Documentation: See `docs/` directory
- Issues: GitHub Issues
- Security: See [SECURITY_ADVISORY.md](./SECURITY_ADVISORY.md)
