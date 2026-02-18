// Request validation middleware for backend security

import crypto from 'crypto';
import { SECURITY_CONFIG } from './config.js';

// Validate request origin
export function validateOrigin(req, res, next) {
  const origin = req.get('origin') || req.get('referer');
  
  if (!origin) {
    // Allow requests without origin (e.g., from curl, Postman in dev)
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    return res.status(403).json({ error: 'Origin header required' });
  }
  
  const isAllowed = SECURITY_CONFIG.allowedOrigins.some(allowed => {
    return origin.startsWith(allowed);
  });
  
  if (!isAllowed) {
    return res.status(403).json({ 
      error: 'Origin not allowed',
      origin,
      allowed: SECURITY_CONFIG.allowedOrigins 
    });
  }
  
  next();
}

// Validate API signature (optional, for critical endpoints)
export function validateSignature(req, res, next) {
  if (!SECURITY_CONFIG.requireAuth) {
    return next();
  }
  
  const signature = req.get('X-Signature');
  const timestamp = req.get('X-Timestamp');
  const apiKey = req.get('X-API-Key') || process.env.ADMIN_API_KEY;
  
  if (!signature || !timestamp || !apiKey) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check timestamp to prevent replay attacks (5 minute window)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 300000) {
    return res.status(401).json({ error: 'Request expired' });
  }
  
  // Verify signature
  const body = JSON.stringify(req.body);
  const message = `${timestamp}:${req.method}:${req.path}:${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(message)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

// Rate limiting middleware
const rateLimitMap = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  } = options;
  
  return (req, res, next) => {
    if (!process.env.ENABLE_RATE_LIMIT || process.env.ENABLE_RATE_LIMIT !== 'true') {
      return next();
    }
    
    const identifier = req.ip || req.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // Get or create rate limit entry
    if (!rateLimitMap.has(identifier)) {
      rateLimitMap.set(identifier, { count: 0, resetAt: now + windowMs });
    }
    
    const rateLimit = rateLimitMap.get(identifier);
    
    // Reset if window expired
    if (now > rateLimit.resetAt) {
      rateLimit.count = 0;
      rateLimit.resetAt = now + windowMs;
    }
    
    // Check limit
    if (rateLimit.count >= maxRequests) {
      const retryAfter = Math.ceil((rateLimit.resetAt - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter 
      });
    }
    
    // Increment counter
    rateLimit.count++;
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', maxRequests - rateLimit.count);
    res.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
    
    next();
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt + 60000) { // Keep for 1 minute after reset
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Run every minute

// Input validation helpers
export function validateWalletAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Basic Solana address validation (32-44 characters, base58)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function validateAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  return amount > 0 && amount < Number.MAX_SAFE_INTEGER;
}

export function validateProviders(providers) {
  if (!Array.isArray(providers) || providers.length === 0) {
    return false;
  }
  const validProviders = ['Raydium', 'Orca', 'Meteora', 'Jupiter'];
  return providers.every(p => validProviders.includes(p));
}

// Request validation middleware for flashloan endpoints
export function validateFlashloanRequest(req, res, next) {
  const { wallet, amount, providers } = req.body;
  
  if (!validateWalletAddress(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  
  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  if (providers && !validateProviders(providers)) {
    return res.status(400).json({ error: 'Invalid providers' });
  }
  
  next();
}

export default {
  validateOrigin,
  validateSignature,
  rateLimit,
  validateFlashloanRequest,
  validateWalletAddress,
  validateAmount,
  validateProviders,
};
