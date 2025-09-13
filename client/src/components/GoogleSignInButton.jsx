import React, { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function GoogleSignInButton({ clientId }) {
  const btnRef = useRef(null);
  const { googleLogin } = useAuth();

  useEffect(() => {
    if (!clientId) return; // don't init without client id
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (response?.credential) {
          try {
            await googleLogin(response.credential);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Google login failed', e);
          }
        }
      },
      ux_mode: 'popup'
    });
    window.google.accounts.id.renderButton(btnRef.current, { theme: 'outline', size: 'large', width: 320 });
  }, [clientId, googleLogin]);

  if (!clientId) {
    return (
      <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Google login unavailable. Set VITE_GOOGLE_CLIENT_ID in client/.env and restart the dev server.
      </div>
    );
  }
  return <div ref={btnRef} />;
}
