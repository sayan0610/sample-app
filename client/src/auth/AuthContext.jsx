import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'auth_user';
const USERS_KEY = 'auth_users';

async function sha256Hex(text) {
  try {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback (demo only, not secure)
    return 'plain:' + btoa(unescape(encodeURIComponent(text)));
  }
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  });

  const login = async ({ username, password }) => {
    if (!username?.trim() || !password?.trim()) {
      const err = new Error('Username and password are required');
      err.code = 'INVALID_INPUT';
      throw err;
    }
    const users = loadUsers();
    if (!users.length) {
      const err = new Error('No users exist. Please create an account first.');
      err.code = 'NO_USERS';
      throw err;
    }
    const hash = await sha256Hex(password);
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.passwordHash === hash);
    if (!found) {
      const err = new Error('Invalid username or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
    const sessionUser = { username: found.username, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  const signup = async ({ username, password }) => {
    if (!username?.trim() || !password?.trim()) {
      const err = new Error('Username and password are required');
      err.code = 'INVALID_INPUT';
      throw err;
    }
    const users = loadUsers();
    const uname = username.trim();
    if (users.some(u => u.username.toLowerCase() === uname.toLowerCase())) {
      const err = new Error('Username already exists');
      err.code = 'DUPLICATE_USER';
      throw err;
    }
    const passwordHash = await sha256Hex(password);
    const newUsers = [...users, { username: uname, passwordHash, createdAt: Date.now() }];
    saveUsers(newUsers);
    // Auto-login after signup
    const sessionUser = { username: uname, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const googleLogin = async (idToken) => {
    // In production, send idToken to your backend for verification with Google.
    // For this demo, decode payload client-side for a basic profile.
    try {
      const [, payload] = idToken.split('.');
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  const sessionUser = { username: json.email || json.sub, name: json.name, picture: json.picture, provider: 'google', token: idToken, ts: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser;
    } catch (e) {
      const err = new Error('Invalid Google credential');
      err.cause = e;
      throw err;
    }
  };

  const updateProfile = (updates = {}) => {
    if (!user) return null;
    try {
      const users = loadUsers();
      const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        saveUsers(users);
      }
      const newSession = { ...user, ...updates, ts: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setUser(newSession);
      return newSession;
    } catch (e) {
      console.error('updateProfile failed', e);
      return null;
    }
  };

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, signup, googleLogin, logout, updateProfile }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
