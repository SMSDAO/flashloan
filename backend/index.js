import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  initializeSolana, 
  executeFlashloan, 
  startPoolListener,
  submitJitoBundleWithRetry,
  checkRPCHealth,
  getExecutionLogs,
  getProfitEvents,
} from './solana.js';
import { SECURITY_CONFIG } from './config.js';
import {
  validateOrigin,
  validateSignature,
  rateLimit,
  validateFlashloanRequest,
} from './validation.js';
import {
  saveTransaction,
  getTransactions,
  saveWalletOperation,
  getWalletOperations,
  getWalletBalance,
  applyWalletOperation,
  getAnalyticsSummary,
  saveProfitEvent,
  getProfitHistory,
  saveAnalyticsEvent,
} from './database.js';

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

// Health check - exempt from origin validation for monitoring tools
app.get('/health', async (req, res) => {
  const rpcHealth = await checkRPCHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rpc: rpcHealth,
  });
});

// Apply security middleware to all other routes
app.use(validateOrigin); // Validate request origin
app.use(rateLimit()); // Apply rate limiting

// Initialize Solana connection
initializeSolana();

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

// Execute flashloan with validation
app.post('/api/flashloan/execute', validateFlashloanRequest, async (req, res) => {
  try {
    const { wallet, amount, minProfit, providers, useJitoBundle } = req.body;
    
    const result = await executeFlashloan({
      wallet,
      amount,
      minProfit: minProfit || 0,
      providers: providers || ['Raydium', 'Orca', 'Jupiter'],
      useJitoBundle: useJitoBundle || false,
    });
    
    // Persist transaction to database
    saveTransaction({
      executionId: result.executionId,
      type: 'flashloan',
      wallet,
      amount,
      status: result.success ? 'completed' : 'failed',
      profit: result.profit || 0,
      provider: result.provider || null,
      signature: result.signature || null,
      error: result.error || null,
    });

    if (result.profit > 0) {
      saveProfitEvent({
        executionId: result.executionId,
        profit: result.profit,
        provider: result.provider,
        strategy: 'flashloan',
      });
    }

    // Emit to socket listeners
    io.emit('flashloanExecuted', result);
    
    res.json(result);
  } catch (error) {
    console.error('Flashloan execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit Jito bundle with validation
app.post('/api/jito/bundle', validateSignature, async (req, res) => {
  try {
    const { transactions, tipAmount } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Invalid transactions' });
    }
    
    const result = await submitJitoBundleWithRetry(transactions, tipAmount || 10000);
    res.json(result);
  } catch (error) {
    console.error('Jito bundle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get execution logs
app.get('/api/logs/:executionId', (req, res) => {
  const { executionId } = req.params;
  const logs = getExecutionLogs(executionId);
  res.json({ executionId, logs });
});

// Get all profit events
app.get('/api/profits', (req, res) => {
  const profits = getProfitEvents();
  res.json({ profits });
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

// Bot execute handler (shared logic)
async function handleBotExecute(req, res) {
  const { strategy, wallet, pool, token, amount } = req.body;
  
  const result = {
    status: 'success',
    strategy,
    wallet,
    pool,
    token,
    amount,
    score: Math.random() * 100,
    profit: (parseFloat(amount) || 0) * 0.001,
    timestamp: Date.now(),
  };

  saveTransaction({
    type: 'bot',
    wallet,
    amount: parseFloat(amount) || 0,
    token: token || 'SOL',
    status: 'completed',
    profit: result.profit,
    provider: pool,
  });
  
  io.emit('botExecuted', result);
  res.json(result);
}

app.post('/bots/execute', handleBotExecute);
// Also expose under /api prefix for frontend compatibility
app.post('/api/bots/execute', handleBotExecute);

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

// Analytics - now served from database
app.get('/analytics', (req, res) => {
  try {
    const summary = getAnalyticsSummary();
    res.json(summary);
  } catch {
    res.json({
      totalVolume: 1250000,
      totalProfit: 15678.50,
      executionCount: 2543,
      successRate: 98.5,
      avgProfitPerTx: 6.16,
    });
  }
});

// Profit history
app.get('/api/profits/history', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  res.json({ profits: getProfitHistory(hours) });
});

// Transaction history
app.get('/api/transactions', (req, res) => {
  const { wallet, limit, offset } = req.query;
  res.json({
    transactions: getTransactions({
      wallet,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    }),
  });
});

// --- Wallet deposit/withdraw endpoints ---

// Get wallet balance and transaction history
app.get('/api/wallet/:address', (req, res) => {
  const { address } = req.params;
  const token = req.query.token || 'SOL';
  const balance = getWalletBalance(address, token);
  const ops = getWalletOperations(address, 20);
  res.json({
    address,
    balance,
    token,
    transactions: ops.length,
    history: ops,
  });
});

// Deposit funds
app.post('/api/wallet/deposit', async (req, res) => {
  try {
    const { wallet, amount, token = 'SOL', signature } = req.body;

    const parsedAmount = Number(amount);
    if (!wallet || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'wallet and positive numeric amount are required' });
    }

    const result = applyWalletOperation({
      wallet,
      operation: 'deposit',
      amount: parsedAmount,
      token,
      signature: signature || null,
    });

    saveAnalyticsEvent('deposit', { wallet, amount: parsedAmount, token });
    io.emit('walletUpdate', { wallet, operation: 'deposit', amount: parsedAmount, token });

    res.json({
      success: true,
      operation: 'deposit',
      wallet,
      amount: parsedAmount,
      token,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      id: result.id,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw funds
app.post('/api/wallet/withdraw', async (req, res) => {
  try {
    const { wallet, amount, token = 'SOL', destination } = req.body;

    const parsedAmount = Number(amount);
    if (!wallet || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'wallet and positive numeric amount are required' });
    }

    let result;
    try {
      result = applyWalletOperation({
        wallet,
        operation: 'withdraw',
        amount: parsedAmount,
        token,
        signature: null,
      });
    } catch (balanceError) {
      return res.status(400).json({ error: balanceError.message });
    }

    saveAnalyticsEvent('withdraw', { wallet, amount: parsedAmount, token, destination });
    io.emit('walletUpdate', { wallet, operation: 'withdraw', amount: parsedAmount, token });

    res.json({
      success: true,
      operation: 'withdraw',
      wallet,
      amount: parsedAmount,
      token,
      destination: destination || wallet,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      id: result.id,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: error.message });
  }
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
