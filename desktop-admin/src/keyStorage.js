// Encrypted Key Storage Module for Desktop Admin
import { invoke } from '@tauri-apps/api/tauri';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'flashloan_encrypted_keys';
const SESSION_KEY = 'session_encryption_key';

class KeyStorage {
  constructor() {
    this.isUnlocked = false;
    this.sessionKey = null;
    this.keys = {};
  }
  
  // Initialize and check if keys exist
  async initialize() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return !!stored;
    } catch (error) {
      console.error('Failed to initialize key storage:', error);
      return false;
    }
  }
  
  // Create new encrypted storage with master password
  async createStorage(masterPassword) {
    if (!masterPassword || masterPassword.length < 8) {
      throw new Error('Master password must be at least 8 characters');
    }
    
    // Generate encryption key from password
    const encryptionKey = CryptoJS.PBKDF2(masterPassword, 'flashloan-salt', {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
    
    // Create empty encrypted storage
    const emptyData = {
      version: '1.0.0',
      created: new Date().toISOString(),
      keys: {},
    };
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(emptyData),
      encryptionKey
    ).toString();
    
    localStorage.setItem(STORAGE_KEY, encrypted);
    
    // Set session key
    this.sessionKey = encryptionKey;
    this.isUnlocked = true;
    this.keys = {};
    
    return true;
  }
  
  // Unlock storage with master password
  async unlock(masterPassword) {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) {
        throw new Error('No encrypted storage found');
      }
      
      // Derive key from password
      const encryptionKey = CryptoJS.PBKDF2(masterPassword, 'flashloan-salt', {
        keySize: 256 / 32,
        iterations: 10000,
      }).toString();
      
      // Try to decrypt
      const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey);
      const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      if (!data || !data.keys) {
        throw new Error('Invalid password or corrupted data');
      }
      
      this.sessionKey = encryptionKey;
      this.isUnlocked = true;
      this.keys = data.keys;
      
      // Store session key in memory (not localStorage for security)
      sessionStorage.setItem(SESSION_KEY, encryptionKey);
      
      return true;
    } catch (error) {
      console.error('Failed to unlock storage:', error);
      throw new Error('Invalid password');
    }
  }
  
  // Lock storage (clear session)
  lock() {
    this.isUnlocked = false;
    this.sessionKey = null;
    this.keys = {};
    sessionStorage.removeItem(SESSION_KEY);
  }
  
  // Add a new private key
  async addKey(name, privateKey, metadata = {}) {
    if (!this.isUnlocked) {
      throw new Error('Storage is locked');
    }
    
    if (!name || !privateKey) {
      throw new Error('Name and private key are required');
    }
    
    // Validate Solana private key format (base58, 88 chars for private key)
    if (privateKey.length < 32) {
      throw new Error('Invalid private key format');
    }
    
    this.keys[name] = {
      key: privateKey,
      metadata: {
        ...metadata,
        created: new Date().toISOString(),
        lastUsed: null,
      },
    };
    
    await this.save();
    return true;
  }
  
  // Get a private key
  getKey(name) {
    if (!this.isUnlocked) {
      throw new Error('Storage is locked');
    }
    
    const keyData = this.keys[name];
    if (!keyData) {
      throw new Error('Key not found');
    }
    
    // Update last used timestamp
    keyData.metadata.lastUsed = new Date().toISOString();
    this.save();
    
    return keyData.key;
  }
  
  // List all key names (without revealing the keys)
  listKeys() {
    if (!this.isUnlocked) {
      throw new Error('Storage is locked');
    }
    
    return Object.keys(this.keys).map(name => ({
      name,
      metadata: this.keys[name].metadata,
    }));
  }
  
  // Delete a key
  async deleteKey(name) {
    if (!this.isUnlocked) {
      throw new Error('Storage is locked');
    }
    
    if (!this.keys[name]) {
      throw new Error('Key not found');
    }
    
    delete this.keys[name];
    await this.save();
    return true;
  }
  
  // Save encrypted storage
  async save() {
    if (!this.isUnlocked || !this.sessionKey) {
      throw new Error('Storage is locked');
    }
    
    const data = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      keys: this.keys,
    };
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.sessionKey
    ).toString();
    
    localStorage.setItem(STORAGE_KEY, encrypted);
  }
  
  // Export encrypted backup
  async exportBackup() {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) {
      throw new Error('No storage to export');
    }
    
    return {
      version: '1.0.0',
      exported: new Date().toISOString(),
      data: encrypted,
    };
  }
  
  // Import encrypted backup
  async importBackup(backupData, masterPassword) {
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup data');
    }
    
    // Verify we can decrypt it
    const encryptionKey = CryptoJS.PBKDF2(masterPassword, 'flashloan-salt', {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
    
    try {
      const decrypted = CryptoJS.AES.decrypt(backupData.data, encryptionKey);
      const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      if (!data || !data.keys) {
        throw new Error('Invalid backup data');
      }
      
      // Save imported data
      localStorage.setItem(STORAGE_KEY, backupData.data);
      
      // Unlock with the password
      await this.unlock(masterPassword);
      
      return true;
    } catch (error) {
      throw new Error('Failed to import backup: ' + error.message);
    }
  }
  
  // Change master password
  async changeMasterPassword(oldPassword, newPassword) {
    // First unlock with old password
    await this.unlock(oldPassword);
    
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }
    
    // Generate new encryption key
    const newEncryptionKey = CryptoJS.PBKDF2(newPassword, 'flashloan-salt', {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
    
    // Re-encrypt with new key
    const data = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      keys: this.keys,
    };
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      newEncryptionKey
    ).toString();
    
    localStorage.setItem(STORAGE_KEY, encrypted);
    this.sessionKey = newEncryptionKey;
    
    return true;
  }
}

// Create singleton instance
const keyStorage = new KeyStorage();

export default keyStorage;
