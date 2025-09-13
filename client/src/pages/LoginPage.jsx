import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (password !== confirm) {
          throw new Error('Passwords do not match');
        }
        await signup({ username, password });
      } else {
        await login({ username, password });
      }
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="brand-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span className="brand-accent">Task</span>
          <span className="brand-light">Manager</span>
        </h1>
        <h2 className="auth-title">{mode === 'signup' ? 'Create your account' : 'Sign in'}</h2>
  <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="your.name"
              disabled={loading}
              required
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </label>
          {mode === 'signup' && (
            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </label>
          )}
          {error && <div className="error-banner" role="alert">{error}</div>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <div style={{ display:'grid', placeItems:'center', marginTop: 8 }}>
          <GoogleSignInButton clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID} />
        </div>
        <p className="auth-hint">
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            className="link-btn"
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
            disabled={loading}
          >
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}
