import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  initializeSolana, 
  executeFlashloan, 
  startPoolListener,
  submitJitoBundle,
  checkRPCHealth 
} from './solana.js';
import { SECURITY_CONFIG } from './config.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: SECURITY_CONFIG.allowedOrigins,
    credentials: true,
  }
});

// Middleware
app.use(express.json());
app.use(cors({ origin: SECURITY_CONFIG.allowedOrigins, credentials: true }));

// Initialize Solana connection
initializeSolana();

// Health check
app.get('/health', async (req, res) => {
  const rpcHealth = await checkRPCHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rpc: rpcHealth,
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    version: '2.0.0',
    features: [
      'Solana Flashloans',
      'Multi-Provider Support',
      'Jito MEV Bundles',
      'Dynamic Fee Optimization',
      'Real-time Pool Monitoring',
    ],
  });
});

// Execute flashloan
app.post('/api/flashloan/execute', async (req, res) => {
  try {
    const { wallet, amount, minProfit, providers, useJitoBundle } = req.body;
    
    if (!wallet || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const result = await executeFlashloan({
      wallet,
      amount,
      minProfit: minProfit || 0,
      providers: providers || ['Raydium', 'Orca', 'Jupiter'],
      useJitoBundle: useJitoBundle || false,
    });
    
    // Emit to socket listeners
    io.emit('flashloanExecuted', result);
    
    res.json(result);
  } catch (error) {
    console.error('Flashloan execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit Jito bundle
app.post('/api/jito/bundle', async (req, res) => {
  try {
    const { transactions, tipAmount } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Invalid transactions' });
    }
    
    const result = await submitJitoBundle(transactions, tipAmount || 1000);
    res.json(result);
  } catch (error) {
    console.error('Jito bundle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bot management
app.get('/bots', (req, res) => {
  res.json({
    bots: [
      { id: 1, name: 'Turbo Bot', status: 'active', strategy: 'turbo', profit: 12.5 },
      { id: 2, name: 'Ninja Bot', status: 'active', strategy: 'ninja', profit: 8.3 },
      { id: 3, name: 'Sniper Bot', status: 'paused', strategy: 'sniper', profit: 15.7 },
    ],
  });
});

app.post('/bots/execute', async (req, res) => {
  const { strategy, wallet, pool, token, amount } = req.body;
  
  // Simulate bot execution with Solana integration
  const result = {
    status: 'success',
    strategy,
    wallet,
    pool,
    token,
    amount,
    score: Math.random() * 100,
    profit: amount * 0.001,
    timestamp: Date.now(),
  };
  
  // Emit to socket listeners
  io.emit('botExecuted', result);
  
  res.json(result);
});

// Market data endpoints
app.get('/market', (req, res) => {
  res.json({
    pools: [
      { name: 'SOL-USDC', tvl: 125000000, volume24h: 45000000, apy: 12.5 },
      { name: 'SOL-USDT', tvl: 98000000, volume24h: 32000000, apy: 10.2 },
      { name: 'RAY-USDC', tvl: 65000000, volume24h: 18000000, apy: 15.8 },
    ],
  });
});

// Strategies
app.get('/strategies', (req, res) => {
  res.json({
    strategies: [
      { name: 'turbo', description: 'High-speed arbitrage', riskLevel: 'medium' },
      { name: 'ninja', description: 'Stealth execution', riskLevel: 'low' },
      { name: 'sniper', description: 'Precision targeting', riskLevel: 'high' },
    ],
  });
});

// Analytics
app.get('/analytics', (req, res) => {
  res.json({
    totalVolume: 1250000,
    totalProfit: 15678.50,
    executionCount: 2543,
    successRate: 98.5,
    avgProfitPerTx: 6.16,
  });
});

// Wallet info
app.get('/wallet/:address', (req, res) => {
  res.json({
    address: req.params.address,
    balance: 10.5,
    token: 'SOL',
    transactions: 142,
  });
});

// Tokens
app.get('/tokens', (req, res) => {
  res.json({
    tokens: [
      { symbol: 'SOL', name: 'Solana', price: 145.32, change24h: 5.2 },
      { symbol: 'USDC', name: 'USD Coin', price: 1.00, change24h: 0.01 },
      { symbol: 'RAY', name: 'Raydium', price: 2.45, change24h: -1.8 },
    ],
  });
});

// Scoring
app.get('/scoring', (req, res) => {
  res.json({
    metrics: [
      { name: 'Liquidity Score', value: 85, max: 100 },
      { name: 'Volume Score', value: 92, max: 100 },
      { name: 'Volatility Score', value: 78, max: 100 },
    ],
  });
});

// Cycle/workflow monitoring
app.get('/cycle', (req, res) => {
  res.json({
    cycles: [
      { id: 1, status: 'completed', duration: 2.5, profit: 0.05 },
      { id: 2, status: 'running', duration: 1.2, profit: 0 },
    ],
  });
});

// Founders info
app.get('/founders', (req, res) => {
  res.json([
    { name: 'Founder1', wallet: 'WalletAddress1', meta: 'Lead Dev' },
    { name: 'Founder2', wallet: 'WalletAddress2', meta: 'Co-Founder' },
  ]);
});

app.get('/', (req, res) => {
  res.json({
    name: 'Solana Flashloan Arbitrage Backend',
    version: '2.0.0',
    status: 'running',
  });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  // Flashloan execution
  socket.on('flashloan', async (data) => {
    try {
      const result = await executeFlashloan(data);
      socket.emit('flashloanResult', result);
      io.emit('flashloanExecuted', result); // Broadcast to all
    } catch (error) {
      socket.emit('flashloanError', { error: error.message });
    }
  });
  
  // Pool monitoring
  socket.on('subscribePool', (poolAddress) => {
    console.log('Pool subscription:', poolAddress);
    startPoolListener([poolAddress], (update) => {
      socket.emit('poolUpdate', update);
    });
  });
  
  // Bot control
  socket.on('executeBot', (botConfig) => {
    console.log('Bot execution requested:', botConfig);
    // Execute bot logic
    socket.emit('botResult', { status: 'executed', config: botConfig });
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Solana Flashloan Arbitrage Backend running on port ${port}`);
  console.log(`📊 Features: Multi-provider, Jito MEV, Dynamic Fees, Real-time Monitoring`);
});

export default app;
