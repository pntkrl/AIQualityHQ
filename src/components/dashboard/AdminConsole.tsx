import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  Activity, 
  ShieldCheck, 
  RotateCw, 
  LogOut, 
  Unlock, 
  Clock, 
  Terminal, 
  Layers
} from 'lucide-react';

function apiBase() { 
  return typeof window !== 'undefined' ? window.location.origin + '/api' : '/api'; 
}

interface SummaryStats {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeSessions: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalUsageRequests: number;
  usageRequests24h: number;
}

interface SubscriptionStats {
  plan: string;
  count: number;
}

interface SignupStats {
  name: string;
  email: string;
  created_at: string;
}

interface EndpointStats {
  endpoint: string;
  count: number;
}

interface AdminData {
  summary: SummaryStats;
  subscriptions: SubscriptionStats[];
  recentSignups: SignupStats[];
  topEndpoints: EndpointStats[];
}

export default function AdminConsole() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<AdminData | null>(null);

  // Check if token exists in sessionStorage on load
  useEffect(() => {
    const savedToken = sessionStorage.getItem('aiq_admin_token');
    if (savedToken) {
      setToken(savedToken);
      verifyAndFetch(savedToken);
    }
  }, []);

  const handleLocalhostFallback = (tokenValue: string) => {
    const adminPassword = "aiqualityhq-admin-secret-2026";
    if (tokenValue !== adminPassword) {
      setErrorMsg('Invalid Admin Access Token.');
      setIsAuthenticated(false);
      sessionStorage.removeItem('aiq_admin_token');
      return;
    }

    // Load local users from localStorage to mock the registered users count
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localStorage.getItem('aiq_users') || '[]');
    } catch (e) {
      // ignore
    }

    const mockData: AdminData = {
      summary: {
        totalUsers: localUsers.length,
        newUsers7d: localUsers.length,
        newUsers30d: localUsers.length,
        activeSessions: 1,
        totalApiKeys: 2,
        activeApiKeys: 1,
        totalUsageRequests: 124,
        usageRequests24h: 12
      },
      subscriptions: [
        { plan: 'free', count: localUsers.length }
      ],
      recentSignups: localUsers.map((u: any) => ({
        name: u.name || 'Anonymous',
        email: u.email,
        created_at: new Date().toISOString()
      })).slice(-10).reverse(),
      topEndpoints: [
        { endpoint: '/api/check', count: 98 },
        { endpoint: '/api/auth/me', count: 26 }
      ]
    };

    setData(mockData);
    setIsAuthenticated(true);
    sessionStorage.setItem('aiq_admin_token', tokenValue);
  };

  const verifyAndFetch = async (tokenValue: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${apiBase()}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenValue}`
        }
      });

      if (res.ok) {
        const statsData = await res.json() as AdminData;
        setData(statsData);
        setIsAuthenticated(true);
        sessionStorage.setItem('aiq_admin_token', tokenValue);
      } else {
        // Localhost fallback for testing if API returns 404 (functions not running under local npm run dev)
        if (res.status === 404 && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          handleLocalhostFallback(tokenValue);
          return;
        }

        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to authenticate admin token.');
        setIsAuthenticated(false);
        sessionStorage.removeItem('aiq_admin_token');
      }
    } catch (err) {
      // Localhost fallback for testing if API is completely unreachable
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        handleLocalhostFallback(tokenValue);
        return;
      }
      setErrorMsg('Network error. Failed to reach the admin API.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Please enter an admin token.');
      return;
    }
    setToken(tokenInput);
    verifyAndFetch(tokenInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aiq_admin_token');
    setIsAuthenticated(false);
    setToken('');
    setTokenInput('');
    setData(null);
  };

  const handleRefresh = () => {
    if (token) {
      verifyAndFetch(token);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      });
    } catch {
      return isoString;
    }
  };

  // 1. RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="max-w-[440px] mx-auto my-12 flex flex-col gap-6 font-sans">
        <div className="border border-border bg-surface-secondary/40 rounded-xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary border border-primary-border flex items-center justify-center">
              <Unlock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-semibold text-text-primary mt-2">Owner Administration</h1>
            <p className="text-xs text-text-secondary">Enter your admin access token to view metrics</p>
          </div>

          {errorMsg && (
            <div className="border border-error-subtle bg-error-subtle text-error p-3 rounded-lg text-xs leading-normal">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-token" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">
                Admin Token
              </label>
              <input
                type="password"
                id="admin-token"
                placeholder="••••••••••••••••"
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-pressed text-text-on-primary font-medium text-sm transition-all duration-fast flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Authenticating…' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. RENDER ADMIN DASHBOARD IF AUTHENTICATED
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 font-sans">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Owner Console</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            Website Usage &amp; Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time monitoring of user accounts, active sessions, and API endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-secondary text-xs font-semibold select-none cursor-pointer transition-fast disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-error-subtle bg-surface text-error hover:bg-error-subtle/10 text-xs font-semibold select-none cursor-pointer transition-fast"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="border border-border bg-surface-secondary/40 rounded-xl p-5 flex items-start gap-4">
              <div className="p-3 bg-primary-subtle text-primary border border-primary-border rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-tertiary">Total Registered Users</span>
                <span className="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">{data.summary.totalUsers}</span>
                <span className="text-[10px] text-text-secondary mt-1 flex gap-1.5">
                  <span className="text-primary font-medium">+{data.summary.newUsers7d}</span> last 7d
                  <span className="text-text-disabled">|</span>
                  <span className="text-primary font-medium">+{data.summary.newUsers30d}</span> last 30d
                </span>
              </div>
            </div>

            <div className="border border-border bg-surface-secondary/40 rounded-xl p-5 flex items-start gap-4">
              <div className="p-3 bg-primary-subtle text-primary border border-primary-border rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-tertiary">Active Sessions</span>
                <span className="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">{data.summary.activeSessions}</span>
                <span className="text-[10px] text-text-secondary mt-1">Currently logged-in clients</span>
              </div>
            </div>

            <div className="border border-border bg-surface-secondary/40 rounded-xl p-5 flex items-start gap-4">
              <div className="p-3 bg-primary-subtle text-primary border border-primary-border rounded-lg">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-tertiary">Active API Keys</span>
                <span className="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">{data.summary.activeApiKeys}</span>
                <span className="text-[10px] text-text-secondary mt-1">{data.summary.totalApiKeys} keys created in total</span>
              </div>
            </div>

            <div className="border border-border bg-surface-secondary/40 rounded-xl p-5 flex items-start gap-4">
              <div className="p-3 bg-primary-subtle text-primary border border-primary-border rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-tertiary">API Request Volume</span>
                <span className="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">{data.summary.totalUsageRequests}</span>
                <span className="text-[10px] text-text-secondary mt-1 flex gap-1.5">
                  <span className="text-primary font-medium">+{data.summary.usageRequests24h}</span> past 24 hours
                </span>
              </div>
            </div>

          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Signups list */}
            <div className="lg:col-span-2 border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Recent User Registrations</h2>
                <p className="text-[11px] text-text-secondary mt-0.5">List of the last 10 accounts created on AIQualityHQ.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-tertiary font-mono uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 font-semibold">Name</th>
                      <th className="py-2.5 font-semibold">Email Address</th>
                      <th className="py-2.5 font-semibold">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSignups.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-text-tertiary italic">No registrations found.</td>
                      </tr>
                    ) : (
                      data.recentSignups.map((user, idx) => (
                        <tr key={idx} className="border-b border-border-subtle/50 hover:bg-surface-secondary/20 transition-fast">
                          <td className="py-3 font-medium text-text-primary">{user.name || 'Anonymous User'}</td>
                          <td className="py-3 text-text-secondary">{user.email}</td>
                          <td className="py-3 text-text-tertiary font-mono">{formatDateTime(user.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subscriptions & Endpoint Usage Cards */}
            <div className="flex flex-col gap-6">
              
              {/* Plan Distribution */}
              <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Subscription Plans</h2>
                  <p className="text-[11px] text-text-secondary mt-0.5">Distribution of user accounts by plan level.</p>
                </div>
                <div className="flex flex-col gap-2.5">
                  {data.subscriptions.length === 0 ? (
                    <div className="text-center text-text-tertiary italic text-xs py-2">No subscription data.</div>
                  ) : (
                    data.subscriptions.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-border-subtle bg-surface-secondary/30 rounded-lg p-3">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
                          {sub.plan}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {sub.count} {sub.count === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Endpoints */}
              <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Popular API Endpoints</h2>
                  <p className="text-[11px] text-text-secondary mt-0.5">Top endpoints hitting the backend engine.</p>
                </div>
                <div className="flex flex-col gap-2 font-mono text-[11px]">
                  {data.topEndpoints.length === 0 ? (
                    <div className="text-center text-text-tertiary italic text-xs py-2">No API logs recorded yet.</div>
                  ) : (
                    data.topEndpoints.map((ep, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-border-subtle py-2">
                        <span className="flex items-center gap-1.5 text-text-secondary truncate pr-4">
                          <Terminal className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                          <span className="truncate">{ep.endpoint}</span>
                        </span>
                        <span className="font-semibold text-text-primary shrink-0 bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                          {ep.count} hits
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
