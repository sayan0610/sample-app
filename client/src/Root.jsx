import React from 'react';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { useHeaderOffset } from './hooks/useHeaderOffset.js';

function Gate() {
  useHeaderOffset();
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <App /> : <LoginPage />;
}

export default function Root() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
