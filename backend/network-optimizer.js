import { NETWORK_CONFIG } from './config.js';
import https from 'https';
import http from 'http';

// IP Rotation and Proxy Management
class NetworkOptimizer {
  constructor() {
    this.proxyList = NETWORK_CONFIG.proxyList;
    this.currentProxyIndex = 0;
    this.proxyHealth = new Map();
    this.vpnEnabled = NETWORK_CONFIG.enableVPN;
    this.ipRotationEnabled = NETWORK_CONFIG.enableIPRotation;
  }

  // Get next proxy from rotation
  getNextProxy() {
    if (!this.ipRotationEnabled || this.proxyList.length === 0) {
      return null;
    }

    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    
    return proxy;
  }

  // Parse proxy string (format: http://user:pass@host:port)
  parseProxy(proxyStr) {
    try {
      const url = new URL(proxyStr);
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: parseInt(url.port) || 8080,
        auth: url.username && url.password ? {
          username: url.username,
          password: url.password,
        } : null,
      };
    } catch (error) {
      console.error('Invalid proxy format:', proxyStr);
      return null;
    }
  }

  // Create HTTP(S) agent with proxy
  createProxyAgent(proxyStr) {
    const proxy = this.parseProxy(proxyStr);
    if (!proxy) return null;

    const AgentClass = proxy.protocol === 'https' ? https.Agent : http.Agent;
    
    return new AgentClass({
      host: proxy.host,
      port: proxy.port,
      auth: proxy.auth ? `${proxy.auth.username}:${proxy.auth.password}` : null,
      keepAlive: true,
      maxSockets: 50,
    });
  }

  // Check proxy health
  async checkProxyHealth(proxyStr) {
    const startTime = Date.now();
    
    try {
      const agent = this.createProxyAgent(proxyStr);
      if (!agent) return { healthy: false, latency: 0 };

      // Test connection through proxy
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        agent,
        signal: AbortSignal.timeout(NETWORK_CONFIG.connectionTimeout),
      });

      const latency = Date.now() - startTime;
      const healthy = response.ok;

      this.proxyHealth.set(proxyStr, { healthy, latency, lastCheck: Date.now() });

      return { healthy, latency };
    } catch (error) {
      this.proxyHealth.set(proxyStr, { healthy: false, latency: 0, lastCheck: Date.now() });
      return { healthy: false, latency: 0, error: error.message };
    }
  }

  // Get fastest healthy proxy
  async getFastestProxy() {
    if (this.proxyList.length === 0) return null;

    // Check all proxies in parallel
    const healthChecks = await Promise.all(
      this.proxyList.map(async (proxy) => ({
        proxy,
        health: await this.checkProxyHealth(proxy),
      }))
    );

    // Sort by latency and filter healthy ones
    const healthyProxies = healthChecks
      .filter(p => p.health.healthy)
      .sort((a, b) => a.health.latency - b.health.latency);

    return healthyProxies.length > 0 ? healthyProxies[0].proxy : null;
  }

  // Get current IP address
  async getCurrentIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get current IP:', error);
      return null;
    }
  }

  // VPN management (placeholder for actual VPN integration)
  async enableVPN() {
    console.log('VPN enablement requested - integrate with VPN provider API');
    // In production, integrate with:
    // - NordVPN API
    // - ExpressVPN API
    // - WireGuard
    // - OpenVPN
    return { success: true, message: 'VPN enabled (simulated)' };
  }

  async disableVPN() {
    console.log('VPN disablement requested');
    return { success: true, message: 'VPN disabled (simulated)' };
  }

  // Connection optimizer - selects best connection method
  async optimizeConnection() {
    const currentIP = await this.getCurrentIP();
    
    if (this.ipRotationEnabled && this.proxyList.length > 0) {
      const fastestProxy = await this.getFastestProxy();
      if (fastestProxy) {
        return {
          method: 'proxy',
          proxy: fastestProxy,
          currentIP,
        };
      }
    }

    if (this.vpnEnabled) {
      await this.enableVPN();
      return {
        method: 'vpn',
        currentIP,
      };
    }

    return {
      method: 'direct',
      currentIP,
    };
  }

  // Get connection stats
  getConnectionStats() {
    return {
      ipRotationEnabled: this.ipRotationEnabled,
      vpnEnabled: this.vpnEnabled,
      totalProxies: this.proxyList.length,
      healthyProxies: Array.from(this.proxyHealth.values()).filter(h => h.healthy).length,
      proxyHealth: Object.fromEntries(this.proxyHealth),
    };
  }
}

// Singleton instance
let networkOptimizer = null;

export function getNetworkOptimizer() {
  if (!networkOptimizer) {
    networkOptimizer = new NetworkOptimizer();
  }
  return networkOptimizer;
}

export async function optimizeNetworkConnection() {
  const optimizer = getNetworkOptimizer();
  return await optimizer.optimizeConnection();
}

export async function getNetworkStats() {
  const optimizer = getNetworkOptimizer();
  return optimizer.getConnectionStats();
}

export default {
  getNetworkOptimizer,
  optimizeNetworkConnection,
  getNetworkStats,
  NetworkOptimizer,
};
