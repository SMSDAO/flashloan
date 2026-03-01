# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 24+**: Download from [nodejs.org](https://nodejs.org/)
- **Rust 1.70+**: Install via [rustup.rs](https://rustup.rs/)
- **Git**: For cloning the repository
- **Python 3.10+**: For bot scripts (optional)

### Optional Tools
- **Solana CLI**: For program deployment
- **Anchor CLI**: For Anchor program development
- **PM2**: For production process management

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/SMSDAO/flashloan.git
cd flashloan
```

### Step 2: Install Dependencies

Install all project dependencies:

```bash
npm run setup
```

This will install dependencies for:
- Root workspace
- Backend
- Frontend
- Desktop admin app (optional)

### Step 3: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required Settings
NODE_ENV=development
PORT=4000
SOLANA_NETWORK=devnet

# Optional: Premium RPC URLs (for production)
HELIUS_RPC_URL=
QUICKNODE_RPC_URL=
TRITON_RPC_URL=

# Network Optimization (optional)
ENABLE_IP_ROTATION=false
ENABLE_VPN=false

# Security
KEY_ENCRYPTION_KEY=your-secure-key-here-change-in-production
REQUIRE_AUTH=false
```

### Step 4: Build Solana Program (Optional)

If you have Solana CLI installed:

```bash
# Install Solana CLI if not already installed
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Build the program
npm run build:program
```

For development without deploying, you can skip this step.

## Development Mode

### Start All Services

Start both backend and frontend in development mode:

```bash
npm run dev
```

Or use the convenience script:

```bash
./scripts/dev.sh
```

This will start:
- Backend server on `http://localhost:4000`
- Frontend on `http://localhost:3000`

### Start Services Individually

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

**Desktop Admin:**
```bash
cd desktop-admin
npm run tauri:dev
```

## Production Deployment

### Automated Deployment

Use the deployment script:

```bash
./scripts/deploy.sh
```

This script will:
1. Check Node.js version
2. Install dependencies
3. Build frontend
4. Build Solana program (if Rust is available)
5. Start services with PM2

### Manual Deployment

1. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

3. **Start with PM2:**
   ```bash
   pm2 start backend/index.js --name flashloan-backend
   cd frontend && pm2 start "npm start" --name flashloan-frontend
   pm2 save
   pm2 startup
   ```

### Stop Services

```bash
./scripts/stop.sh
```

Or manually with PM2:
```bash
pm2 stop all
pm2 delete all
```

## Building Desktop Admin

### Development

```bash
cd desktop-admin
npm install
npm run tauri:dev
```

### Production Build (Windows)

```bash
cd desktop-admin
npm run tauri:build:windows
```

This creates `admin.exe` in `desktop-admin/src-tauri/target/release/`.

## Deploying Solana Program

### Devnet Deployment

1. **Generate a keypair:**
   ```bash
   solana-keygen new -o deployer.json
   ```

2. **Airdrop SOL (devnet):**
   ```bash
   solana airdrop 2 deployer.json --url devnet
   ```

3. **Build and deploy:**
   ```bash
   npm run deploy:devnet
   ```

### Mainnet Deployment

⚠️ **Warning**: Mainnet deployment requires real SOL and should only be done after thorough testing.

1. **Ensure you have sufficient SOL:**
   ```bash
   solana balance deployer.json --url mainnet-beta
   ```

2. **Deploy:**
   ```bash
   npm run deploy:mainnet
   ```

3. **Update `.env` with new program ID:**
   ```bash
   PROGRAM_ID=YourNewProgramId
   ```

## Configuration

### RPC Endpoints

#### Development
Uses public Solana RPCs automatically based on `SOLANA_NETWORK`.

#### Production
Set premium RPC URLs in `.env`:
```bash
HELIUS_RPC_URL=https://your-helius-url
QUICKNODE_RPC_URL=https://your-quicknode-url
```

The system automatically uses premium RPCs in production.

### Network Optimization

Enable IP rotation and proxy support:

```bash
ENABLE_IP_ROTATION=true
PROXY_LIST=http://proxy1.com:8080,http://proxy2.com:8080
```

Enable VPN:
```bash
ENABLE_VPN=true
```

### Gas Fee Configuration

Adjust gas fee parameters:

```bash
MIN_TIP_LAMPORTS=1000
MAX_TIP_LAMPORTS=100000
PRIORITY_FEE_PERCENTILE=75
```

### Security Settings

```bash
# Change this to a secure random string in production!
KEY_ENCRYPTION_KEY=generate-a-secure-key-here

# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Enable authentication
REQUIRE_AUTH=true
```

## Verification

### Check Backend

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "rpc": {
    "healthy": true,
    ...
  }
}
```

### Check Frontend

Open browser to `http://localhost:3000`

### Check WebSocket

```javascript
// In browser console
const socket = io('http://localhost:4000');
socket.on('connect', () => console.log('Connected!'));
```

## Troubleshooting

### Port Already in Use

Change ports in `.env`:
```bash
PORT=4001
```

And in `frontend/package.json`:
```json
"dev": "next dev -p 3001"
```

### Node Version Error

Ensure Node.js 24+ is installed:
```bash
node --version
# Should show v24.x.x or higher
```

### RPC Connection Issues

1. Check network setting in `.env`
2. Verify internet connection
3. Try different RPC endpoint
4. Check firewall settings

### Build Errors

Clear caches and reinstall:
```bash
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm run setup
```

### Solana Program Build Errors

Ensure Rust and Solana CLI are installed:
```bash
rustc --version
solana --version
```

## Next Steps

1. **Explore the Dashboard**: Navigate to `http://localhost:3000/dashboard`
2. **Read API Docs**: Check `docs/API.md` for endpoint details
3. **Review Architecture**: See `docs/ARCHITECTURE.md` for system design
4. **Run Tests**: Execute `npm test` to validate installation
5. **Customize Bots**: Modify bot strategies in `bot/` directory

## Support

For issues and questions:
- GitHub Issues: https://github.com/SMSDAO/flashloan/issues
- Documentation: `./docs/`

## Production Checklist

Before deploying to mainnet:

- [ ] Update `.env` with production values
- [ ] Configure premium RPC endpoints
- [ ] Test on devnet thoroughly
- [ ] Enable authentication (`REQUIRE_AUTH=true`)
- [ ] Change `KEY_ENCRYPTION_KEY` to secure value
- [ ] Set up monitoring and alerting
- [ ] Review security settings
- [ ] Backup wallet keypairs securely
- [ ] Test failover scenarios
- [ ] Set up logging infrastructure
- [ ] Configure rate limiting
- [ ] Enable IP restrictions
- [ ] Audit Solana program
- [ ] Test with small amounts first

## Maintenance

### Update Dependencies

```bash
npm update
cd backend && npm update && cd ..
cd frontend && npm update && cd ..
```

### View Logs

With PM2:
```bash
pm2 logs
pm2 logs flashloan-backend
pm2 logs flashloan-frontend
```

Or check log files:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Restart Services

```bash
pm2 restart all
# or
pm2 restart flashloan-backend
pm2 restart flashloan-frontend
```

### Monitor Performance

```bash
pm2 monit
```

---

**Happy Arbitraging! 🚀**
