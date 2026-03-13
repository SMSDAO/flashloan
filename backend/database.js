/**
 * SQLite database module for data persistence
 * Stores transactions, wallet operations, analytics events
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'flashloan.db');

// Ensure data directory exists (skip for in-memory databases)
const dataDir = path.dirname(DB_PATH);
if (DB_PATH !== ':memory:' && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

export function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id TEXT UNIQUE,
      type TEXT NOT NULL,
      wallet TEXT,
      amount REAL,
      token TEXT DEFAULT 'SOL',
      status TEXT DEFAULT 'pending',
      profit REAL DEFAULT 0,
      fee REAL DEFAULT 0,
      provider TEXT,
      signature TEXT,
      error TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS wallet_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL,
      operation TEXT NOT NULL,
      amount REAL NOT NULL,
      token TEXT DEFAULT 'SOL',
      balance_before REAL,
      balance_after REAL,
      signature TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS wallet_balances (
      wallet TEXT NOT NULL,
      token TEXT NOT NULL DEFAULT 'SOL',
      balance REAL NOT NULL DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY (wallet, token)
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      data TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS profit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id TEXT,
      profit REAL NOT NULL,
      token TEXT DEFAULT 'SOL',
      provider TEXT,
      strategy TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet);
    CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_wallet_ops_wallet ON wallet_operations(wallet);
    CREATE INDEX IF NOT EXISTS idx_profit_events_created ON profit_events(created_at);
  `);
}

// Transaction operations
export function saveTransaction(tx) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO transactions
      (execution_id, type, wallet, amount, token, status, profit, fee, provider, signature, error)
    VALUES
      (@execution_id, @type, @wallet, @amount, @token, @status, @profit, @fee, @provider, @signature, @error)
  `);
  return stmt.run({
    execution_id: tx.executionId || tx.execution_id || null,
    type: tx.type || 'flashloan',
    wallet: tx.wallet || null,
    amount: tx.amount || 0,
    token: tx.token || 'SOL',
    status: tx.status || 'pending',
    profit: tx.profit || 0,
    fee: tx.fee || 0,
    provider: tx.provider || null,
    signature: tx.signature || null,
    error: tx.error || null,
  });
}

export function getTransactions({ wallet, limit = 50, offset = 0 } = {}) {
  const db = getDB();
  if (wallet) {
    return db.prepare(
      'SELECT * FROM transactions WHERE wallet = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(wallet, limit, offset);
  }
  return db.prepare(
    'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);
}

// Wallet operations
export function saveWalletOperation(op) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO wallet_operations
      (wallet, operation, amount, token, balance_before, balance_after, signature, status)
    VALUES
      (@wallet, @operation, @amount, @token, @balance_before, @balance_after, @signature, @status)
  `);
  return stmt.run({
    wallet: op.wallet,
    operation: op.operation,
    amount: op.amount,
    token: op.token || 'SOL',
    balance_before: op.balanceBefore ?? null,
    balance_after: op.balanceAfter ?? null,
    signature: op.signature || null,
    status: op.status || 'completed',
  });
}

export function getWalletBalance(wallet, token = 'SOL') {
  const db = getDB();
  const row = db.prepare(
    'SELECT balance FROM wallet_balances WHERE wallet = ? AND token = ?'
  ).get(wallet, token);
  return row ? row.balance : 0;
}

// Atomically apply a balance change and record the operation
export function applyWalletOperation(op) {
  const db = getDB();

  return db.transaction(() => {
    const currentBalance = getWalletBalance(op.wallet, op.token || 'SOL');
    const delta = op.operation === 'deposit' ? op.amount : -op.amount;
    const newBalance = currentBalance + delta;

    if (newBalance < 0) {
      throw new Error(`Insufficient balance: current=${currentBalance}, requested=${op.amount}`);
    }

    // Upsert balance
    db.prepare(`
      INSERT INTO wallet_balances (wallet, token, balance, updated_at)
      VALUES (?, ?, ?, strftime('%s','now'))
      ON CONFLICT(wallet, token) DO UPDATE SET
        balance = excluded.balance,
        updated_at = excluded.updated_at
    `).run(op.wallet, op.token || 'SOL', newBalance);

    // Record the operation
    const result = db.prepare(`
      INSERT INTO wallet_operations
        (wallet, operation, amount, token, balance_before, balance_after, signature, status)
      VALUES
        (@wallet, @operation, @amount, @token, @balance_before, @balance_after, @signature, @status)
    `).run({
      wallet: op.wallet,
      operation: op.operation,
      amount: op.amount,
      token: op.token || 'SOL',
      balance_before: currentBalance,
      balance_after: newBalance,
      signature: op.signature || null,
      status: 'completed',
    });

    return { id: result.lastInsertRowid, balanceBefore: currentBalance, balanceAfter: newBalance };
  })();
}

export function getWalletOperations(wallet, limit = 50) {
  const db = getDB();
  return db.prepare(
    'SELECT * FROM wallet_operations WHERE wallet = ? ORDER BY created_at DESC LIMIT ?'
  ).all(wallet, limit);
}

// Analytics
export function saveAnalyticsEvent(eventType, data) {
  const db = getDB();
  return db.prepare(
    'INSERT INTO analytics_events (event_type, data) VALUES (?, ?)'
  ).run(eventType, JSON.stringify(data));
}

export function getAnalyticsSummary() {
  const db = getDB();
  const totalVolume = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) AS val FROM transactions WHERE status = 'completed'"
  ).get()?.val || 0;
  const totalProfit = db.prepare(
    "SELECT COALESCE(SUM(profit), 0) AS val FROM transactions WHERE status = 'completed'"
  ).get()?.val || 0;
  const executionCount = db.prepare(
    "SELECT COUNT(*) AS val FROM transactions"
  ).get()?.val || 0;
  const successCount = db.prepare(
    "SELECT COUNT(*) AS val FROM transactions WHERE status = 'completed'"
  ).get()?.val || 0;
  return {
    totalVolume,
    totalProfit,
    executionCount,
    successRate: executionCount > 0 ? (successCount / executionCount) * 100 : 0,
    avgProfitPerTx: successCount > 0 ? totalProfit / successCount : 0,
  };
}

// Profit events
export function saveProfitEvent(event) {
  const db = getDB();
  return db.prepare(`
    INSERT INTO profit_events (execution_id, profit, token, provider, strategy)
    VALUES (@execution_id, @profit, @token, @provider, @strategy)
  `).run({
    execution_id: event.executionId || null,
    profit: event.profit,
    token: event.token || 'SOL',
    provider: event.provider || null,
    strategy: event.strategy || null,
  });
}

export function getProfitHistory(hours = 24) {
  const db = getDB();
  const since = Math.floor(Date.now() / 1000) - hours * 3600;
  return db.prepare(
    'SELECT * FROM profit_events WHERE created_at >= ? ORDER BY created_at DESC'
  ).all(since);
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
