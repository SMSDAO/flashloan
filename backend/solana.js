import { Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { getActiveRPC, PROGRAM_IDS, FEE_CONFIG, RPC_CONFIG } from './config.js';
import axios from 'axios';

// Initialize Solana connection with RPC fallback
let connection = null;
let program = null;
let currentRPCIndex = 0;
let rpcFallbackList = [];

// Event emitter for structured logging
class EventLogger {
  constructor() {
    this.events = [];
  }
  
  log(event) {
    const structuredEvent = {
      timestamp: new Date().toISOString(),
      level: event.level || 'info',
      category: event.category || 'general',
      message: event.message,
      data: event.data || {},
      executionId: event.executionId,
    };
    this.events.push(structuredEvent);
    console.log(JSON.stringify(structuredEvent));
    return structuredEvent;
  }
  
  getEvents(filter = {}) {
    return this.events.filter(event => {
      return Object.keys(filter).every(key => event[key] === filter[key]);
    });
  }
}

export const logger = new EventLogger();

// Initialize RPC fallback list from config
function initializeRPCFallback() {
  rpcFallbackList = [];
  
  // Add premium RPCs if configured
  if (process.env.HELIUS_RPC_URL && !process.env.HELIUS_RPC_URL.includes('YOUR_')) {
    rpcFallbackList.push(process.env.HELIUS_RPC_URL);
  }
  if (process.env.QUICKNODE_RPC_URL && !process.env.QUICKNODE_RPC_URL.includes('YOUR_')) {
    rpcFallbackList.push(process.env.QUICKNODE_RPC_URL);
  }
  if (process.env.TRITON_RPC_URL && !process.env.TRITON_RPC_URL.includes('YOUR_')) {
    rpcFallbackList.push(process.env.TRITON_RPC_URL);
  }
  if (process.env.ALCHEMY_RPC_URL && !process.env.ALCHEMY_RPC_URL.includes('YOUR_')) {
    rpcFallbackList.push(process.env.ALCHEMY_RPC_URL);
  }
  
  // Add public RPCs as fallback
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const publicRPCs = RPC_CONFIG.public || [];
  rpcFallbackList.push(...publicRPCs);
  
  logger.log({
    level: 'info',
    category: 'rpc',
    message: 'RPC fallback list initialized',
    data: { rpcCount: rpcFallbackList.length, network },
  });
  
  return rpcFallbackList;
}

// Get next RPC with fallback
export function getNextRPC() {
  if (rpcFallbackList.length === 0) {
    initializeRPCFallback();
  }
  
  if (currentRPCIndex >= rpcFallbackList.length) {
    currentRPCIndex = 0;
  }
  
  const rpcUrl = rpcFallbackList[currentRPCIndex];
  logger.log({
    level: 'debug',
    category: 'rpc',
    message: 'Selected RPC endpoint',
    data: { index: currentRPCIndex, url: rpcUrl.substring(0, 30) + '...' },
  });
  
  return rpcUrl;
}

// Fallback to next RPC on error
export async function fallbackToNextRPC() {
  currentRPCIndex++;
  logger.log({
    level: 'warn',
    category: 'rpc',
    message: 'Falling back to next RPC',
    data: { newIndex: currentRPCIndex },
  });
  return initializeSolana();
}

export function initializeSolana() {
  const rpcUrl = getNextRPC();
  connection = new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
  
  logger.log({
    level: 'info',
    category: 'init',
    message: 'Solana connection initialized',
    data: { rpcUrl: rpcUrl.substring(0, 50) + '...' },
  });
  
  return connection;
}

export function getConnection() {
  if (!connection) {
    return initializeSolana();
  }
  return connection;
}

// Dynamic gas/fee optimization with structured logging
export async function optimizeFees(connection, executionId = null) {
  try {
    const recentFees = await connection.getRecentPrioritizationFees();
    
    if (recentFees && recentFees.length > 0) {
      // Calculate percentile-based fee
      const sortedFees = recentFees
        .map(f => f.prioritizationFee)
        .sort((a, b) => a - b);
      
      const percentileIndex = Math.floor(sortedFees.length * (FEE_CONFIG.priorityFeePercentile / 100));
      const baseFee = sortedFees[percentileIndex] || FEE_CONFIG.minTipLamports;
      
      // Apply dynamic multiplier
      const optimizedFee = Math.min(
        Math.max(Math.floor(baseFee * FEE_CONFIG.dynamicMultiplier), FEE_CONFIG.minTipLamports),
        FEE_CONFIG.maxTipLamports
      );
      
      logger.log({
        level: 'info',
        category: 'fee_optimization',
        message: 'Fee optimized',
        data: {
          baseFee,
          optimizedFee,
          percentile: FEE_CONFIG.priorityFeePercentile,
          sampleSize: sortedFees.length,
        },
        executionId,
      });
      
      return optimizedFee;
    }
  } catch (error) {
    logger.log({
      level: 'error',
      category: 'fee_optimization',
      message: 'Error optimizing fees',
      data: { error: error.message },
      executionId,
    });
  }
  
  return FEE_CONFIG.minTipLamports;
}

// Reentrancy guard: track in-flight executions per wallet
const _executionLocks = new Set();

// Multi-provider flashloan execution with profit events and execution timeline
export async function executeFlashloan(params) {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timeline = [];
  
  const {
    wallet,
    amount,
    minProfit = 0,
    providers = ['Raydium', 'Orca', 'Jupiter'],
    useJitoBundle = false,
  } = params;
  
  // Validation
  if (!wallet || !amount) {
    throw new Error('Wallet and amount are required');
  }
  
  // Reentrancy guard: reject concurrent executions for the same wallet
  if (_executionLocks.has(wallet)) {
    throw new Error('Execution already in progress for this wallet');
  }
  _executionLocks.add(wallet);
  
  try {
    return await _executeFlashloanInner({ wallet, amount, minProfit, providers, useJitoBundle, executionId, timeline });
  } finally {
    _executionLocks.delete(wallet);
  }
}

// Inner execution logic (called with reentrancy guard held)
async function _executeFlashloanInner(params) {
  const { wallet, amount, minProfit, providers, useJitoBundle, executionId, timeline } = params;
  
  timeline.push({ stage: 'init', timestamp: Date.now(), status: 'started' });
  
  logger.log({
    level: 'info',
    category: 'flashloan',
    message: 'Flashloan execution started',
    data: { wallet, amount, minProfit, providers, useJitoBundle },
    executionId,
  });
  
  const conn = getConnection();
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Optimize fees
      timeline.push({ stage: 'fee_optimization', timestamp: Date.now(), status: 'started' });
      const priorityFee = await optimizeFees(conn, executionId);
      timeline.push({ stage: 'fee_optimization', timestamp: Date.now(), status: 'completed', priorityFee });
      
      // Build transaction
      timeline.push({ stage: 'build_transaction', timestamp: Date.now(), status: 'started' });
      const transaction = await buildFlashloanTransaction({
        wallet,
        amount,
        providers,
        priorityFee,
        executionId,
      });
      timeline.push({ stage: 'build_transaction', timestamp: Date.now(), status: 'completed' });
      
      // Execute with Jito bundle if requested
      let result;
      if (useJitoBundle) {
        timeline.push({ stage: 'jito_submission', timestamp: Date.now(), status: 'started' });
        result = await submitJitoBundleWithRetry([transaction], priorityFee, executionId);
        timeline.push({ stage: 'jito_submission', timestamp: Date.now(), status: 'completed', bundleId: result.bundleId });
      } else {
        timeline.push({ stage: 'standard_submission', timestamp: Date.now(), status: 'started' });
        result = await sendTransaction(transaction, conn, executionId);
        timeline.push({ stage: 'standard_submission', timestamp: Date.now(), status: 'completed', signature: result.txSignature });
      }
      
      // Calculate profit
      const profit = calculateProfit(amount, providers);
      timeline.push({ stage: 'profit_calculation', timestamp: Date.now(), profit });
      
      // Enforce minimum profit threshold before completing
      if (minProfit > 0 && profit < minProfit) {
        logger.log({
          level: 'warn',
          category: 'flashloan',
          message: 'Profit below minimum threshold, aborting',
          data: { profit, minProfit },
          executionId,
        });
        return {
          executionId,
          wallet,
          amount,
          providers,
          profit,
          profitPercentage: (profit / amount) * 100,
          timeline,
          status: 'skipped',
          reason: 'profit_below_minimum',
          timestamp: new Date().toISOString(),
        };
      }
      
      // Emit profit event
      const profitEvent = {
        executionId,
        wallet,
        amount,
        providers,
        profit,
        profitPercentage: (profit / amount) * 100,
        priorityFee,
        useJitoBundle,
        timeline,
        status: 'success',
        timestamp: new Date().toISOString(),
      };
      
      logger.log({
        level: 'info',
        category: 'profit_event',
        message: 'Flashloan profit realized',
        data: profitEvent,
        executionId,
      });
      
      return {
        ...profitEvent,
        txSignature: result.txSignature || result.bundleId,
      };
      
    } catch (error) {
      retryCount++;
      timeline.push({ 
        stage: 'error', 
        timestamp: Date.now(), 
        attempt: retryCount, 
        error: error.message 
      });
      
      logger.log({
        level: 'warn',
        category: 'flashloan',
        message: `Execution attempt ${retryCount} failed`,
        data: { error: error.message, retryCount },
        executionId,
      });
      
      if (retryCount >= maxRetries) {
        // Try RPC fallback on final retry
        if (error.message.includes('RPC') || error.message.includes('timeout')) {
          await fallbackToNextRPC();
        }
        
        throw new Error(`Flashloan execution failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }
}

// Build flashloan transaction
async function buildFlashloanTransaction(params) {
  const { wallet, amount, providers, priorityFee, executionId } = params;
  
  logger.log({
    level: 'debug',
    category: 'transaction',
    message: 'Building flashloan transaction',
    data: { wallet, amount, providers },
    executionId,
  });
  
  // In production, this would build actual Anchor instructions
  // For now, return a simulated transaction
  return {
    wallet,
    amount,
    providers,
    priorityFee,
    instructions: [],
    timestamp: Date.now(),
  };
}

// Send transaction with confirmation
async function sendTransaction(transaction, connection, executionId) {
  logger.log({
    level: 'debug',
    category: 'transaction',
    message: 'Sending transaction',
    data: { wallet: transaction.wallet },
    executionId,
  });
  
  // Simulate transaction sending
  const txSignature = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.log({
    level: 'info',
    category: 'transaction',
    message: 'Transaction sent',
    data: { txSignature },
    executionId,
  });
  
  return { txSignature, status: 'confirmed' };
}

// Calculate profit from arbitrage
function calculateProfit(amount, providers) {
  // Simulate profit calculation (0.05% - 0.15% based on providers)
  const baseProfit = amount * 0.0005;
  const providerBonus = providers.length * 0.0002 * amount;
  return baseProfit + providerBonus;
}

// Listen for liquidity pool updates (parallel workflow listener)
export async function startPoolListener(pools, callback) {
  const conn = getConnection();
  
  console.log('Starting pool listeners for:', pools);
  
  pools.forEach(pool => {
    // Subscribe to account changes
    const poolPubkey = new PublicKey(pool);
    const subscriptionId = conn.onAccountChange(
      poolPubkey,
      (accountInfo, context) => {
        callback({
          pool,
          accountInfo,
          slot: context.slot,
          timestamp: Date.now(),
        });
      },
      'confirmed'
    );
    
    console.log('Pool listener started for:', pool, 'subscription:', subscriptionId);
  });
}

// Jito MEV bundle submission with retry logic and fallback
export async function submitJitoBundleWithRetry(transactions, tipAmount, executionId, maxRetries = 3) {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const jitoEndpoints = RPC_CONFIG.jito || {};
  const endpoint = jitoEndpoints[network] || jitoEndpoints.devnet;
  
  if (!endpoint || !process.env.JITO_TIP_ACCOUNT) {
    logger.log({
      level: 'warn',
      category: 'jito',
      message: 'Jito configuration missing, falling back to standard transaction',
      executionId,
    });
    
    // Fallback to standard transaction submission
    const conn = getConnection();
    return await sendTransaction(transactions[0], conn, executionId);
  }
  
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log({
        level: 'info',
        category: 'jito',
        message: `Jito bundle submission attempt ${attempt}`,
        data: { txCount: transactions.length, tipAmount, endpoint },
        executionId,
      });
      
      const result = await submitJitoBundle(transactions, tipAmount, endpoint, executionId);
      
      logger.log({
        level: 'info',
        category: 'jito',
        message: 'Jito bundle submitted successfully',
        data: { bundleId: result.bundleId, attempt },
        executionId,
      });
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      logger.log({
        level: 'warn',
        category: 'jito',
        message: `Jito submission attempt ${attempt} failed`,
        data: { error: error.message, attempt, maxRetries },
        executionId,
      });
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Final fallback: use standard transaction
  logger.log({
    level: 'warn',
    category: 'jito',
    message: 'Jito bundle failed all retries, falling back to standard transaction',
    data: { error: lastError?.message },
    executionId,
  });
  
  const conn = getConnection();
  return await sendTransaction(transactions[0], conn, executionId);
}

// Jito MEV bundle submission
export async function submitJitoBundle(transactions, tipAmount, endpoint, executionId) {
  logger.log({
    level: 'debug',
    category: 'jito',
    message: 'Submitting Jito bundle',
    data: { txCount: transactions.length, tipAmount, endpoint: endpoint?.substring(0, 50) },
    executionId,
  });
  
  // In production, this would make actual HTTP request to Jito block engine
  // For now, simulate successful submission
  const bundleId = `jito_bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Simulate API call (in production, use axios to post to Jito)
  /*
  const response = await axios.post(endpoint, {
    jsonrpc: '2.0',
    id: 1,
    method: 'sendBundle',
    params: [
      transactions.map(tx => tx.serialize().toString('base64')),
      {
        encoding: 'base64',
      },
    ],
  });
  */
  
  return {
    status: 'success',
    bundleId,
    transactions: transactions.length,
    tipAmount,
    timestamp: new Date().toISOString(),
  };
}

// Health check for RPC connection with fallback
export async function checkRPCHealth() {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const conn = getConnection();
      const slot = await conn.getSlot();
      const blockTime = await conn.getBlockTime(slot);
      
      const health = {
        healthy: true,
        slot,
        blockTime,
        rpcUrl: getNextRPC().substring(0, 50) + '...',
        attempt: attempt + 1,
      };
      
      logger.log({
        level: 'info',
        category: 'health_check',
        message: 'RPC health check passed',
        data: health,
      });
      
      return health;
    } catch (error) {
      attempt++;
      
      logger.log({
        level: 'warn',
        category: 'health_check',
        message: `RPC health check failed (attempt ${attempt})`,
        data: { error: error.message, attempt, maxRetries },
      });
      
      if (attempt < maxRetries) {
        // Try fallback RPC
        await fallbackToNextRPC();
      } else {
        return {
          healthy: false,
          error: error.message,
          rpcUrl: getNextRPC().substring(0, 50) + '...',
          attempts: attempt,
        };
      }
    }
  }
  
  return {
    healthy: false,
    error: 'All RPC health checks failed',
    attempts: maxRetries,
  };
}

// Get execution logs by ID
export function getExecutionLogs(executionId) {
  return logger.getEvents({ executionId });
}

// Get all profit events
export function getProfitEvents() {
  return logger.getEvents({ category: 'profit_event' });
}

export default {
  initializeSolana,
  getConnection,
  optimizeFees,
  executeFlashloan,
  startPoolListener,
  submitJitoBundle,
  submitJitoBundleWithRetry,
  checkRPCHealth,
  getNextRPC,
  fallbackToNextRPC,
  getExecutionLogs,
  getProfitEvents,
  logger,
};
