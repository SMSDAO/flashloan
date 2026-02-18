// Key Storage Unlock UI Component
import { useState, useEffect } from 'react';
import keyStorage from './keyStorage';
import './KeyUnlock.css';

export default function KeyUnlock({ onUnlocked }) {
  const [hasStorage, setHasStorage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('unlock'); // 'unlock' or 'create'
  
  useEffect(() => {
    checkStorage();
  }, []);
  
  const checkStorage = async () => {
    setIsLoading(true);
    const exists = await keyStorage.initialize();
    setHasStorage(exists);
    setMode(exists ? 'unlock' : 'create');
    setIsLoading(false);
  };
  
  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await keyStorage.unlock(password);
      onUnlocked();
    } catch (err) {
      setError('Invalid password. Please try again.');
    }
  };
  
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      await keyStorage.createStorage(password);
      onUnlocked();
    } catch (err) {
      setError('Failed to create storage: ' + err.message);
    }
  };
  
  if (isLoading) {
    return (
      <div className="unlock-container">
        <div className="unlock-card">
          <div className="unlock-loader">
            <div className="spinner"></div>
            <p>Initializing...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="unlock-container">
      <div className="unlock-card">
        <div className="unlock-header">
          <div className="unlock-icon">🔐</div>
          <h2>{mode === 'unlock' ? 'Unlock Key Storage' : 'Create Key Storage'}</h2>
          <p className="unlock-subtitle">
            {mode === 'unlock' 
              ? 'Enter your master password to access encrypted private keys'
              : 'Set a master password to protect your private keys'
            }
          </p>
        </div>
        
        <form onSubmit={mode === 'unlock' ? handleUnlock : handleCreate} className="unlock-form">
          <div className="form-group">
            <label>Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'unlock' ? 'Enter password' : 'Create password (min 8 chars)'}
              required
              autoFocus
            />
          </div>
          
          {mode === 'create' && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          )}
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
          
          <button type="submit" className="unlock-button">
            {mode === 'unlock' ? '🔓 Unlock' : '✨ Create Storage'}
          </button>
        </form>
        
        {mode === 'create' && (
          <div className="security-notice">
            <div className="notice-icon">⚠️</div>
            <div className="notice-text">
              <strong>Important:</strong> Your master password cannot be recovered. 
              Store it securely. Never share it with anyone.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
