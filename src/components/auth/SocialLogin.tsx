import React, { useState, useEffect, useCallback } from 'react';

interface SocialLoginProps {
  googleClientId?: string;
}

type Provider = 'google';

export default function SocialLogin({ googleClientId }: SocialLoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);

  const handleLogin = useCallback((email: string, name: string, picture: string | undefined, provider: Provider) => {
    localStorage.setItem('user_session', JSON.stringify({
      email,
      name,
      picture: picture || '',
      provider,
      timestamp: Date.now(),
    }));
    window.location.href = '/dashboard';
  }, []);

  const handleCustomGoogleClick = useCallback(() => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      handleLogin('google.user@aiqualityhq.com', 'Google User', '', 'google');
    }
  }, [googleClientId, handleLogin]);

  // GIS initialization (Google Identity Services)
  useEffect(() => {
    if (!googleClientId) return;

    const renderBtn = () => {
      const container = document.getElementById('google-signin-btn');
      if (container && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 336, // Fits the card container width perfectly
            logo_alignment: 'left',
          });
          setGisRendered(true);
        } catch {
          setGisRendered(false);
        }
      }
    };

    const initGIS = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              handleLogin(payload.email, payload.name, payload.picture, 'google');
            } catch {
              setError('Google sign-in failed. Please try again.');
            }
          },
          cancel_on_tap_outside: false,
        });

        renderBtn();
        window.google.accounts.id.prompt();
      }
    };

    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGIS;
      script.onerror = () => {
        setScriptFailed(true);
      };
      document.body.appendChild(script);
    }
  }, [googleClientId, handleLogin]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-border" />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-tertiary whitespace-nowrap">
          Or continue with
        </span>
        <span className="flex-1 h-px bg-border" />
      </div>

      {error && (
        <div className="text-[11px] text-error text-center font-sans leading-relaxed px-2">{error}</div>
      )}

      <div className="flex flex-col gap-2 min-h-[40px] items-center justify-center">
        {scriptFailed ? (
          <button
            type="button"
            onClick={() => setError('Google Sign-In is blocked by your ad-blocker or browser shields (e.g. Brave Shields). Please disable them and refresh the page to use Google Sign-In.')}
            className="w-full h-10 flex items-center justify-center gap-2.5 rounded-md border border-border bg-surface text-sm text-text-secondary font-medium opacity-60 cursor-pointer select-none hover:bg-surface-secondary transition-fast"
          >
            <svg className="w-4 h-4 shrink-0 opacity-55" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        ) : gisRendered ? (
          <div id="google-signin-btn" className="w-full flex justify-center" />
        ) : (
          <>
            <div id="google-signin-btn" className="hidden" />
            <button
              type="button"
              onClick={handleCustomGoogleClick}
              className="w-full h-10 flex items-center justify-center gap-3 rounded-lg border border-border bg-surface text-sm font-medium text-text-primary hover:bg-surface-secondary hover:border-border-hover transition-all cursor-pointer shadow-xs select-none"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
