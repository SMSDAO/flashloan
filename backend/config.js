import dotenv from 'dotenv';
dotenv.config();

// Solana RPC Configuration with auto-selection
export const RPC_CONFIG = {
  // Public RPCs for initial deployment/testing
  public: [
    'https://api.mainnet-beta.solana.com',
    'https://api.devnet.solana.com',
    'https://api.testnet.solana.com',
  ],
  // Premium RPCs (validate before use in production)
  premium: [
    process.env.HELIUS_RPC_URL,
    process.env.QUICKNODE_RPC_URL,
    process.env.TRITON_RPC_URL,
    process.env.ALCHEMY_RPC_URL,
  ].filter(Boolean),
  // Jito endpoints for MEV bundle submission
  jito: {
    mainnet: 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
    devnet: 'https://bundles-api-rest.devnet.jito.wtf/api/v1/bundles',
  },
};

// Dynamic RPC selection based on environment
export function getActiveRPC() {
  const env = process.env.NODE_ENV || 'development';
  const network = process.env.SOLANA_NETWORK || 'devnet';
  
  if (env === 'production' && RPC_CONFIG.premium.length > 0) {
    // Use premium RPC in production
    return RPC_CONFIG.premium[0];
  }
  
  // Use public RPC for development/testing
  const publicIndex = network === 'mainnet' ? 0 : network === 'devnet' ? 1 : 2;
  return RPC_CONFIG.public[publicIndex];
}

// Program IDs
export const PROGRAM_IDS = {
  flashloanArbitrage: process.env.PROGRAM_ID || 'F1ash1oanArb1trag3Program11111111111111111',
  raydium: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  orca: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  meteora: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  jupiter: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
};

// Gas/Fee optimization settings
export const FEE_CONFIG = {
  minTipLamports: 1000,
  maxTipLamports: 100000,
  dynamicMultiplier: 1.5,
  priorityFeePercentile: 75, // Use 75th percentile for priority fees
};

// Network optimization settings
export const NETWORK_CONFIG = {
  enableIPRotation: process.env.ENABLE_IP_ROTATION === 'true',
  enableVPN: process.env.ENABLE_VPN === 'true',
  proxyList: (process.env.PROXY_LIST || '').split(',').filter(Boolean),
  connectionTimeout: 5000,
  maxRetries: 3,
};

// Security settings
export const SECURITY_CONFIG = {
  encryptPrivateKeys: true,
  keyEncryptionKey: process.env.KEY_ENCRYPTION_KEY || 'default-dev-key-change-in-prod',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  requireAuth: process.env.REQUIRE_AUTH === 'true',
};

export default {
  RPC_CONFIG,
  PROGRAM_IDS,
  FEE_CONFIG,
  NETWORK_CONFIG,
  SECURITY_CONFIG,
  getActiveRPC,
};
