# API Documentation

## Base URL
```
http://localhost:4000
```

## Endpoints

### Health & Status

#### GET /health
Check system health and RPC connection status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T08:10:36.141Z",
  "rpc": {
    "healthy": true,
    "slot": 123456789,
    "blockTime": 1708157436,
    "rpcUrl": "https://api.devnet.solana.com"
  }
}
```

#### GET /api/status
Get backend status and features.

**Response:**
```json
{
  "status": "running",
  "version": "2.0.0",
  "features": [
    "Solana Flashloans",
    "Multi-Provider Support",
    "Jito MEV Bundles",
    "Dynamic Fee Optimization",
    "Real-time Pool Monitoring"
  ]
}
```

### Flashloan Execution

#### POST /api/flashloan/execute
Execute a flashloan arbitrage transaction.

**Request Body:**
```json
{
  "wallet": "YourSolanaWalletAddress",
  "amount": 1000,
  "minProfit": 0.01,
  "providers": ["Raydium", "Orca", "Jupiter"],
  "useJitoBundle": true
}
```

**Response:**
```json
{
  "status": "success",
  "txSignature": "5j7s...transaction...signature",
  "amount": 1000,
  "providers": ["Raydium", "Orca", "Jupiter"],
  "priorityFee": 5000,
  "estimatedProfit": 1.5,
  "executionTime": 1708157436141
}
```

### Jito MEV Bundles

#### POST /api/jito/bundle
Submit a Jito MEV bundle for front-run protection.

**Request Body:**
```json
{
  "transactions": [
    "base64EncodedTransaction1",
    "base64EncodedTransaction2"
  ],
  "tipAmount": 5000
}
```

**Response:**
```json
{
  "status": "success",
  "bundleId": "jito_bundle_1708157436141",
  "transactions": 2,
  "tipAmount": 5000
}
```

### Bot Management

#### GET /bots
List all registered bots.

**Response:**
```json
{
  "bots": [
    {
      "id": 1,
      "name": "Turbo Bot",
      "status": "active",
      "strategy": "turbo",
      "profit": 12.5
    },
    {
      "id": 2,
      "name": "Ninja Bot",
      "status": "active",
      "strategy": "ninja",
      "profit": 8.3
    }
  ]
}
```

#### POST /bots/execute
Execute a specific bot strategy.

**Request Body:**
```json
{
  "strategy": "turbo",
  "wallet": "YourWalletAddress",
  "pool": "SOL-USDC",
  "token": "SOL",
  "amount": 100
}
```

**Response:**
```json
{
  "status": "success",
  "strategy": "turbo",
  "wallet": "YourWalletAddress",
  "pool": "SOL-USDC",
  "token": "SOL",
  "amount": 100,
  "score": 85.3,
  "profit": 0.15,
  "timestamp": 1708157436141
}
```

### Market Data

#### GET /market
Get current market data for all pools.

**Response:**
```json
{
  "pools": [
    {
      "name": "SOL-USDC",
      "tvl": 125000000,
      "volume24h": 45000000,
      "apy": 12.5
    },
    {
      "name": "SOL-USDT",
      "tvl": 98000000,
      "volume24h": 32000000,
      "apy": 10.2
    }
  ]
}
```

#### GET /strategies
List available bot strategies.

**Response:**
```json
{
  "strategies": [
    {
      "name": "turbo",
      "description": "High-speed arbitrage",
      "riskLevel": "medium"
    },
    {
      "name": "ninja",
      "description": "Stealth execution",
      "riskLevel": "low"
    }
  ]
}
```

### Analytics

#### GET /analytics
Get overall platform analytics.

**Response:**
```json
{
  "totalVolume": 1250000,
  "totalProfit": 15678.50,
  "executionCount": 2543,
  "successRate": 98.5,
  "avgProfitPerTx": 6.16
}
```

### Wallet

#### GET /wallet/:address
Get wallet information.

**Response:**
```json
{
  "address": "WalletAddress",
  "balance": 10.5,
  "token": "SOL",
  "transactions": 142
}
```

### Tokens

#### GET /tokens
List supported tokens and prices.

**Response:**
```json
{
  "tokens": [
    {
      "symbol": "SOL",
      "name": "Solana",
      "price": 145.32,
      "change24h": 5.2
    },
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "price": 1.00,
      "change24h": 0.01
    }
  ]
}
```

### Scoring

#### GET /scoring
Get scoring metrics for arbitrage opportunities.

**Response:**
```json
{
  "metrics": [
    {
      "name": "Liquidity Score",
      "value": 85,
      "max": 100
    },
    {
      "name": "Volume Score",
      "value": 92,
      "max": 100
    }
  ]
}
```

### Cycle Monitoring

#### GET /cycle
Get current execution cycles.

**Response:**
```json
{
  "cycles": [
    {
      "id": 1,
      "status": "completed",
      "duration": 2.5,
      "profit": 0.05
    },
    {
      "id": 2,
      "status": "running",
      "duration": 1.2,
      "profit": 0
    }
  ]
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('Connected to backend');
});
```

### Events

#### flashloanExecuted
Emitted when a flashloan is executed.

**Data:**
```json
{
  "status": "success",
  "txSignature": "...",
  "amount": 1000,
  "profit": 1.5,
  "timestamp": 1708157436141
}
```

#### botExecuted
Emitted when a bot completes execution.

**Data:**
```json
{
  "status": "success",
  "strategy": "turbo",
  "profit": 0.15,
  "timestamp": 1708157436141
}
```

#### poolUpdate
Emitted when pool data is updated.

**Data:**
```json
{
  "pool": "PoolAddress",
  "accountInfo": {...},
  "slot": 123456789,
  "timestamp": 1708157436141
}
```

## Error Responses

All endpoints may return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Current rate limits:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Authentication

Authentication is optional and controlled via the `REQUIRE_AUTH` environment variable.

When enabled, include authentication token in headers:
```
Authorization: Bearer <your-token>
```
