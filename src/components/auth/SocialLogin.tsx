import React, { useState, useEffect, useRef, useCallback } from 'react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" rx="1" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" rx="1" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" rx="1" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" rx="1" fill="#FFB900" />
    </svg>
  );
}

interface SocialLoginProps {
  googleClientId?: string;
}

type Provider = 'google' | 'github' | 'microsoft';

export default function SocialLogin({ googleClientId }: SocialLoginProps) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gisInitialized = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval>>();

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

  // GIS initialization (Google Identity Services)
  useEffect(() => {
    if (!googleClientId || gisInitialized.current) return;

    const initGIS = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            setLoading(null);
            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              handleLogin(payload.email, payload.name, payload.picture, 'google');
            } catch {
              setError('Google sign-in failed. Please try again.');
            }
          },
          cancel_on_tap_outside: false,
        });
        gisInitialized.current = true;
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
      document.body.appendChild(script);
    }

    return () => {
      if (window.google?.accounts?.id) {
        try { window.google.accounts.id.cancel(); } catch { /* noop */ }
      }
    };
  }, [googleClientId, handleLogin]);

  // Listen for postMessage from OAuth popups (GitHub, Microsoft)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.provider && event.data?.user?.email) {
        const { provider, user } = event.data;
        if (provider === 'github' || provider === 'microsoft') {
          handleLogin(user.email, user.name, user.picture, provider);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleLogin]);

  const handleGoogleLogin = () => {
    setError(null);
    if (!googleClientId) {
      setError('Google sign-in is not configured. Set PUBLIC_GOOGLE_CLIENT_ID env var at build time.');
      return;
    }
    setLoading('google');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google sign-in is still loading. Please try again.');
      setLoading(null);
    }
  };

  const handleOAuthPopup = (provider: Provider) => {
    if (provider === 'google') {
      handleGoogleLogin();
      return;
    }
    setError(null);
    setLoading(provider);

    const width = 600;
    const height = 700;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);

    const popup = window.open(
      `/api/auth/${provider}/login`,
      `${provider}-auth`,
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    if (!popup || popup.closed) {
      setError('Popup was blocked. Please allow popups for this site and try again.');
      setLoading(null);
      return;
    }

    pollTimer.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer.current);
        setLoading(null);
      }
    }, 500);
  };

  // Cleanup poll timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const buttonClass = (provider: Provider) =>
    `w-full h-10 flex items-center justify-center gap-2.5 rounded-md border border-border bg-surface text-sm text-text-primary font-medium hover:bg-surface-secondary active:bg-surface transition-all duration-fast disabled:opacity-disabled disabled:cursor-not-allowed cursor-pointer select-none`;

  const spinner = <span className="w-4 h-4 border-2 border-text-tertiary border-t-primary rounded-full animate-spin shrink-0" />;

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

      <div className="flex flex-col gap-2">
        <button
          onClick={handleGoogleLogin}
          disabled={loading !== null}
          className={buttonClass('google')}
        >
          {loading === 'google' ? spinner : <GoogleIcon className="w-4 h-4 shrink-0" />}
          <span>Sign in with Google</span>
        </button>

        <button
          onClick={() => handleOAuthPopup('github')}
          disabled={loading !== null}
          className={buttonClass('github')}
        >
          {loading === 'github' ? spinner : <GithubIcon className="w-4 h-4 shrink-0" />}
          <span>Sign in with GitHub</span>
        </button>

        <button
          onClick={() => handleOAuthPopup('microsoft')}
          disabled={loading !== null}
          className={buttonClass('microsoft')}
        >
          {loading === 'microsoft' ? spinner : <MicrosoftIcon className="w-4 h-4 shrink-0" />}
          <span>Sign in with Microsoft</span>
        </button>
      </div>
    </div>
  );
}
