import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sparkles, Lock, CheckCircle2, UserPlus, LogIn, X, Zap } from 'lucide-react';

interface AuthGuardProps {
  toolName: string;
  children: React.ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  trialRemaining: number;
  trialUsed: number;
  maxTrial: number;
  triggerSoftGate: (reason?: string) => void;
  incrementTrialUsage: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  trialRemaining: 5,
  trialUsed: 0,
  maxTrial: 5,
  triggerSoftGate: () => {},
  incrementTrialUsage: () => true,
});

export const useAuthGuard = () => useContext(AuthContext);

export default function AuthGuard({ toolName, children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [trialUsed, setTrialUsed] = useState<number>(0);
  const [showGateModal, setShowGateModal] = useState<boolean>(false);
  const [gateReason, setGateReason] = useState<string>('');
  const maxTrial = 5;

  useEffect(() => {
    // Check if user is authenticated
    const session = localStorage.getItem('user_session') || localStorage.getItem('aiq_session_token');
    if (session) {
      setIsAuthenticated(true);
      return;
    }

    setIsAuthenticated(false);

    // Track daily generous trial scans for anonymous users
    const today = new Date().toISOString().split('T')[0];
    try {
      const usageRaw = localStorage.getItem('aiq_anon_trial');
      if (usageRaw) {
        const parsed = JSON.parse(usageRaw);
        if (parsed.date === today) {
          setTrialUsed(parsed.count || 0);
        } else {
          // Reset for new day
          localStorage.setItem('aiq_anon_trial', JSON.stringify({ date: today, count: 0 }));
          setTrialUsed(0);
        }
      } else {
        localStorage.setItem('aiq_anon_trial', JSON.stringify({ date: today, count: 0 }));
        setTrialUsed(0);
      }
    } catch (e) {
      setTrialUsed(0);
    }
  }, []);

  // Increment usage on scan
  const incrementTrialUsage = (): boolean => {
    if (isAuthenticated) return true;

    const today = new Date().toISOString().split('T')[0];
    const newCount = trialUsed + 1;

    if (newCount > maxTrial) {
      triggerSoftGate("You have reached your 5 generous daily trial scans.");
      return false;
    }

    setTrialUsed(newCount);
    localStorage.setItem('aiq_anon_trial', JSON.stringify({ date: today, count: newCount }));
    return true;
  };

  const triggerSoftGate = (reason?: string) => {
    if (isAuthenticated) return;
    setGateReason(reason || "Create a free account to unlock unlimited scans and copy code bindings.");
    setShowGateModal(true);
  };

  const trialRemaining = Math.max(0, maxTrial - trialUsed);

  // Fallback loader while reading token
  if (isAuthenticated === null) {
    return (
      <div className="w-full p-8 rounded-2xl border border-border bg-surface text-center space-y-3 animate-pulse">
        <div className="w-8 h-8 mx-auto rounded-full bg-primary/20" />
        <div className="h-4 w-48 mx-auto rounded bg-surface-secondary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!isAuthenticated,
        trialRemaining,
        trialUsed,
        maxTrial,
        triggerSoftGate,
        incrementTrialUsage
      }}
    >
      <div className="w-full space-y-4">
        {/* Banner for Anonymous Users showing Generous Free Trial */}
        {!isAuthenticated && (
          <div className="p-3.5 rounded-xl border border-primary-border/60 bg-primary-subtle/30 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
              <span className="text-text-primary">
                <strong>Generous Free Trial Active:</strong> You have <span className="font-mono font-bold text-primary">{trialRemaining} of {maxTrial}</span> instant scans remaining today.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerSoftGate("Create a free account for unlimited daily scans!")}
                className="px-3 py-1 rounded-lg bg-primary text-on-primary font-semibold text-[11px] hover:bg-primary-hover transition-fast cursor-pointer select-none"
              >
                Unlock Unlimited Scans &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Render Full Workspace */}
        {children}

        {/* Soft Gate Modal */}
        {showGateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-[480px] p-6 md:p-8 rounded-2xl border border-primary-border bg-surface shadow-floating text-center space-y-5">
              <button
                type="button"
                onClick={() => setShowGateModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-text-tertiary hover:text-text-primary transition-fast cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-subtle text-primary border border-primary-border flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-subtle text-primary border border-primary-border font-mono text-[11px] font-semibold uppercase">
                  Generous Trial Limit Reached
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-text-primary">
                  You're Loving AIQualityHQ!
                </h3>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                  {gateReason}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a
                  href="/signup"
                  className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-fast flex items-center justify-center gap-2 shadow-sm select-none"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Free Account (6-Digit Email Code) &rarr;</span>
                </a>
                <a
                  href="/login"
                  className="w-full py-2.5 rounded-xl border border-border bg-surface-secondary text-text-primary text-xs font-semibold hover:bg-border-subtle transition-fast flex items-center justify-center gap-2 select-none"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Existing Account</span>
                </a>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-center gap-4 text-[11px] font-mono text-text-tertiary">
                <span>✓ 100% Free Account</span>
                <span>✓ Verified Email Security</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}
