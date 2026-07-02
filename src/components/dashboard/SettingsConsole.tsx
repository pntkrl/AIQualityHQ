import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Trash2, 
  Download, 
  Check, 
  Globe, 
  ShieldCheck,
  User,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  ArrowUpRight
} from 'lucide-react';

const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'paid' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tier: 'paid' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'paid' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', tier: 'paid' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Free)', tier: 'free' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B (Free)', tier: 'free' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B (Free)', tier: 'free' },
  { id: 'microsoft/phi-3-mini-4k-instruct', name: 'Phi-3 Mini (Free)', tier: 'free' },
];

const OPENAI_MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'
];

const ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'
];

const PERPLEXITY_MODELS = [
  'sonar-pro', 'sonar', 'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'
];

interface UserSession {
  email: string;
  timestamp: number;
  tier?: 'free' | 'pro';
}

export default function SettingsConsole() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local');
  const [historyCount, setHistoryCount] = useState(0);
  const [freeUsesRemaining, setFreeUsesRemaining] = useState(10);

  // Gemini (free tier)
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiSaveSuccess, setGeminiSaveSuccess] = useState(false);

  // OpenRouter (paid tier)
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [openrouterSaveSuccess, setOpenrouterSaveSuccess] = useState(false);
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o');

  // HuggingFace (optional fallback)
  const [hfToken, setHfToken] = useState('');
  const [showHfToken, setShowHfToken] = useState(false);
  const [hfSaveSuccess, setHfSaveSuccess] = useState(false);

  // OpenAI (direct)
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiSaveSuccess, setOpenaiSaveSuccess] = useState(false);
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');

  // Anthropic (direct)
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicSaveSuccess, setAnthropicSaveSuccess] = useState(false);
  const [anthropicModel, setAnthropicModel] = useState('claude-3-5-sonnet-20241022');

  // Perplexity (direct)
  const [perplexityKey, setPerplexityKey] = useState('');
  const [showPerplexityKey, setShowPerplexityKey] = useState(false);
  const [perplexitySaveSuccess, setPerplexitySaveSuccess] = useState(false);
  const [perplexityModel, setPerplexityModel] = useState('sonar-pro');

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        setSession(JSON.parse(storedSession));
      }
      
      const storedHistory = JSON.parse(localStorage.getItem('aiq_history') || '[]');
      setHistoryCount(storedHistory.length);

      const storedSync = localStorage.getItem('aiq_sync_mode') as 'local' | 'cloud' | null;
      if (storedSync) {
        setSyncMode(storedSync);
      }

      const storedHfToken = localStorage.getItem('aiq_hf_token') || '';
      setHfToken(storedHfToken);

      const storedGeminiKey = localStorage.getItem('aiq_gemini_api_key') || '';
      setGeminiKey(storedGeminiKey);

      const storedOpenrouterKey = localStorage.getItem('aiq_openrouter_key') || '';
      setOpenrouterKey(storedOpenrouterKey);

      const storedOpenrouterModel = localStorage.getItem('aiq_openrouter_model') || 'openai/gpt-4o';
      setOpenrouterModel(storedOpenrouterModel);

      const storedOpenaiKey = localStorage.getItem('aiq_openai_key') || '';
      setOpenaiKey(storedOpenaiKey);
      const storedOpenaiModel = localStorage.getItem('aiq_openai_model') || 'gpt-4o';
      setOpenaiModel(storedOpenaiModel);

      const storedAnthropicKey = localStorage.getItem('aiq_anthropic_key') || '';
      setAnthropicKey(storedAnthropicKey);
      const storedAnthropicModel = localStorage.getItem('aiq_anthropic_model') || 'claude-3-5-sonnet-20241022';
      setAnthropicModel(storedAnthropicModel);

      const storedPerplexityKey = localStorage.getItem('aiq_perplexity_key') || '';
      setPerplexityKey(storedPerplexityKey);
      const storedPerplexityModel = localStorage.getItem('aiq_perplexity_model') || 'sonar-pro';
      setPerplexityModel(storedPerplexityModel);

      const remainingUsesStr = localStorage.getItem('aiq_free_uses_remaining');
      const remainingUses = remainingUsesStr !== null ? parseInt(remainingUsesStr, 10) : 10;
      setFreeUsesRemaining(remainingUses);
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleSyncToggle = (mode: 'local' | 'cloud') => {
    setSyncMode(mode);
    try {
      localStorage.setItem('aiq_sync_mode', mode);
    } catch (e) {
      // Ignore
    }
  };

  const handleClearHistory = () => {
    if (!confirm('Are you sure you want to delete all verified prompt history? This cannot be undone.')) return;
    
    try {
      localStorage.setItem('aiq_history', '[]');
      setHistoryCount(0);
      alert('All prompt history has been cleared successfully.');
    } catch (e) {
      // Ignore
    }
  };

  const handleBackupDownload = () => {
    try {
      const data = localStorage.getItem('aiq_history') || '[]';
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aiq-history-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to generate backup file.');
    }
  };

  const handleSaveHfToken = () => {
    try {
      localStorage.setItem('aiq_hf_token', hfToken.trim());
      setHfSaveSuccess(true);
      setTimeout(() => setHfSaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save Hugging Face token.');
    }
  };

  const handleSaveGeminiKey = () => {
    try {
      localStorage.setItem('aiq_gemini_api_key', geminiKey.trim());
      setGeminiSaveSuccess(true);
      setTimeout(() => setGeminiSaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save Gemini API key.');
    }
  };

  const handleSaveOpenrouterKey = () => {
    try {
      localStorage.setItem('aiq_openrouter_key', openrouterKey.trim());
      localStorage.setItem('aiq_openrouter_model', openrouterModel);
      setOpenrouterSaveSuccess(true);
      setTimeout(() => setOpenrouterSaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save OpenRouter API key.');
    }
  };

  const handleOpenrouterModelChange = (model: string) => {
    setOpenrouterModel(model);
    localStorage.setItem('aiq_openrouter_model', model);
  };

  const handleSaveOpenaiKey = () => {
    try {
      localStorage.setItem('aiq_openai_key', openaiKey.trim());
      localStorage.setItem('aiq_openai_model', openaiModel);
      setOpenaiSaveSuccess(true);
      setTimeout(() => setOpenaiSaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save OpenAI API key.');
    }
  };

  const handleSaveAnthropicKey = () => {
    try {
      localStorage.setItem('aiq_anthropic_key', anthropicKey.trim());
      localStorage.setItem('aiq_anthropic_model', anthropicModel);
      setAnthropicSaveSuccess(true);
      setTimeout(() => setAnthropicSaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save Anthropic API key.');
    }
  };

  const handleSavePerplexityKey = () => {
    try {
      localStorage.setItem('aiq_perplexity_key', perplexityKey.trim());
      localStorage.setItem('aiq_perplexity_model', perplexityModel);
      setPerplexitySaveSuccess(true);
      setTimeout(() => setPerplexitySaveSuccess(false), 2000);
    } catch (e) {
      alert('Failed to save Perplexity API key.');
    }
  };

  const handleKeyDownSync = (mode: 'local' | 'cloud', e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSyncToggle(mode);
    }
  };

  const handleUpgradePlan = () => {
    if (!session) return;
    try {
      const updatedSession = { ...session, tier: 'pro' as const };
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      const usersList = JSON.parse(localStorage.getItem('aiq_users') || '[]');
      const updatedUsers = usersList.map((u: any) => 
        u.email.toLowerCase() === session.email.toLowerCase() ? { ...u, tier: 'pro' } : u
      );
      localStorage.setItem('aiq_users', JSON.stringify(updatedUsers));
    } catch (e) {
      // Ignore
    }
  };

  const handleDowngradePlan = () => {
    if (!session) return;
    try {
      const updatedSession = { ...session, tier: 'free' as const };
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      localStorage.setItem('aiq_free_uses_remaining', '10');
      setFreeUsesRemaining(10);

      const usersList = JSON.parse(localStorage.getItem('aiq_users') || '[]');
      const updatedUsers = usersList.map((u: any) => 
        u.email.toLowerCase() === session.email.toLowerCase() ? { ...u, tier: 'free' } : u
      );
      localStorage.setItem('aiq_users', JSON.stringify(updatedUsers));
    } catch (e) {
      // Ignore
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      
      {/* PROFILE SECTION */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Profile Credentials</h3>
            <p className="text-xs text-text-secondary mt-0.5">Your current login session credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-text-secondary">Logged in Email</span>
            <span className="font-semibold text-text-primary text-sm mt-0.5">{session?.email || 'demo@aiqualityhq.com'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-text-secondary">Session Started</span>
            <span className="text-text-secondary mt-0.5">
              {session ? new Date(session.timestamp).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* SUBSCRIPTION PLAN & LIMITS */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Subscription Plan</h3>
            <p className="text-xs text-text-secondary mt-0.5">Manage your service tier and AI prompt limits</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-text-secondary">Current Plan</span>
            <span className="font-semibold text-text-primary text-sm mt-0.5 flex items-center gap-2">
              {session?.tier === 'pro' ? 'Premium Pro Tier' : 'Free Account Tier'}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                session?.tier === 'pro' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-border'
              }`}>
                {session?.tier === 'pro' ? 'Unlimited Uses' : `${freeUsesRemaining} Free Uses Left`}
              </span>
            </span>
          </div>

          <div>
            {session?.tier === 'pro' ? (
              <button
                type="button"
                onClick={handleDowngradePlan}
                className="px-3 h-8 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-semibold rounded-md transition-fast cursor-pointer button-press"
              >
                Downgrade to Free
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpgradePlan}
                className="px-3 h-8 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast cursor-pointer button-press shadow-sm"
              >
                Upgrade to Premium Pro ($29/mo)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI SERVICE CONFIGURATION */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">AI Service Configuration</h3>
            <p className="text-xs text-text-secondary mt-0.5">Configure AI providers. Free tier uses Gemini — add OpenRouter for paid models.</p>
          </div>
        </div>

          <div className="flex flex-col gap-2 text-xs text-text-secondary leading-relaxed bg-surface-secondary/50 border border-border-subtle rounded-lg p-3">
            <p className="font-semibold text-text-primary">How AI routing works (priority order):</p>
            <ol className="list-decimal ml-4 flex flex-col gap-0.5">
              <li><strong className="text-text-primary">OpenAI key</strong> &rarr; uses your selected OpenAI model (GPT-4o, etc.)</li>
              <li><strong className="text-text-primary">Anthropic key</strong> &rarr; uses your selected Claude model (Sonnet, Haiku, Opus)</li>
              <li><strong className="text-text-primary">Perplexity key</strong> &rarr; uses your selected Perplexity model (Sonar Pro, etc.)</li>
              <li><strong className="text-text-primary">OpenRouter key</strong> &rarr; uses your selected model (paid <em>or</em> free)</li>
              <li><strong className="text-text-primary">Gemini key</strong> &rarr; uses Gemini 2.0 Flash (free tier, 60 req/min)</li>
              <li><strong className="text-text-primary">HuggingFace token</strong> &rarr; uses Qwen / Phi-3 (rate-limited)</li>
              <li><strong className="text-text-primary">None of the above</strong> &rarr; offline deterministic engine (always works)</li>
            </ol>
          </div>

        {/* OpenAI (direct) */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-text-primary uppercase font-mono">OpenAI &mdash; Direct API</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="openai-key-input" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  id="openai-key-input"
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveOpenaiKey}
                className="px-4 h-9 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm select-none"
              >
                {openaiSaveSuccess ? (
                  <><Check className="w-3.5 h-3.5 text-text-on-primary" /><span>Saved!</span></>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">Model</label>
            <select
              value={openaiModel}
              onChange={(e) => { setOpenaiModel(e.target.value); localStorage.setItem('aiq_openai_model', e.target.value); }}
              className="h-9 px-3 bg-surface border border-border rounded-md text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-default"
            >
              {OPENAI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Anthropic (direct) */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-text-primary uppercase font-mono">Anthropic Claude &mdash; Direct API</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="anthropic-key-input" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              Anthropic API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  id="anthropic-key-input"
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveAnthropicKey}
                className="px-4 h-9 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm select-none"
              >
                {anthropicSaveSuccess ? (
                  <><Check className="w-3.5 h-3.5 text-text-on-primary" /><span>Saved!</span></>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">Model</label>
            <select
              value={anthropicModel}
              onChange={(e) => { setAnthropicModel(e.target.value); localStorage.setItem('aiq_anthropic_model', e.target.value); }}
              className="h-9 px-3 bg-surface border border-border rounded-md text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-default"
            >
              {ANTHROPIC_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Perplexity (direct) */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-text-primary uppercase font-mono">Perplexity &mdash; Direct API</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="perplexity-key-input" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              Perplexity API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  id="perplexity-key-input"
                  type={showPerplexityKey ? 'text' : 'password'}
                  value={perplexityKey}
                  onChange={(e) => setPerplexityKey(e.target.value)}
                  placeholder="pplx-..."
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPerplexityKey(!showPerplexityKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showPerplexityKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSavePerplexityKey}
                className="px-4 h-9 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm select-none"
              >
                {perplexitySaveSuccess ? (
                  <><Check className="w-3.5 h-3.5 text-text-on-primary" /><span>Saved!</span></>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">Model</label>
            <select
              value={perplexityModel}
              onChange={(e) => { setPerplexityModel(e.target.value); localStorage.setItem('aiq_perplexity_model', e.target.value); }}
              className="h-9 px-3 bg-surface border border-border rounded-md text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-default"
            >
              {PERPLEXITY_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* OpenRouter (Paid/Free tier) */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-text-primary uppercase font-mono">OpenRouter &mdash; Paid &amp; Free Models</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="or-key-input" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              OpenRouter API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  id="or-key-input"
                  type={showOpenrouterKey ? 'text' : 'password'}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showOpenrouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveOpenrouterKey}
                className="px-4 h-9 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm select-none"
              >
                {openrouterSaveSuccess ? (
                  <><Check className="w-3.5 h-3.5 text-text-on-primary" /><span>Saved!</span></>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="or-model-select" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              OpenRouter Model
            </label>
            <select
              id="or-model-select"
              value={openrouterModel}
              onChange={(e) => handleOpenrouterModelChange(e.target.value)}
              className="h-9 px-3 bg-surface border border-border rounded-md text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-default"
            >
              <optgroup label="Paid Models">
                {OPENROUTER_MODELS.filter(m => m.tier === 'paid').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
              <optgroup label="Free Models">
                {OPENROUTER_MODELS.filter(m => m.tier === 'free').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            Get an OpenRouter API key at <code>openrouter.ai/keys</code>. Free models cost $0;
            paid models charge your OpenRouter credit balance. OpenRouter is the preferred provider when configured.
          </p>
        </div>

        {/* Gemini (Free tier) */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-text-primary uppercase font-mono">Gemini 2.0 Flash &mdash; Free Tier</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="gemini-key-input" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  id="gemini-key-input"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                className="px-4 h-9 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm select-none"
              >
                {geminiSaveSuccess ? (
                  <><Check className="w-3.5 h-3.5 text-text-on-primary" /><span>Saved!</span></>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
            <p className="text-[10px] text-text-tertiary leading-relaxed">
              Get a <strong>free</strong> Gemini API key at <code>aistudio.google.com/apikey</code>.
              Gemini 2.0 Flash offers 60 requests per minute at no cost. Recommended for all users.
            </p>
          </div>
        </div>

        {/* Hugging Face (optional fallback) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-xs font-semibold text-text-secondary uppercase font-mono">Hugging Face &mdash; Optional Fallback</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="hf-token-input" className="font-mono text-[10px] uppercase font-semibold text-text-secondary font-medium">
              Hugging Face Token
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  id="hf-token-input"
                  type={showHfToken ? 'text' : 'password'}
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                  placeholder="hf_..."
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowHfToken(!showHfToken)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showHfToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveHfToken}
                className="px-4 h-9 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm select-none"
              >
                {hfSaveSuccess ? (
                  <><Check className="w-3.5 h-3.5 text-text-on-primary" /><span>Saved!</span></>
                ) : (
                  <span>Save Token</span>
                )}
              </button>
            </div>
            <p className="text-[10px] text-text-tertiary leading-relaxed">
              Used as fallback when OpenRouter and Gemini are unavailable. Get a free token at <code>hf.co/settings/tokens</code>.
            </p>
          </div>
        </div>
      </div>

      {/* STORAGE & SYNC SECTION */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Storage & Sync Mode</h3>
            <p className="text-xs text-text-secondary mt-0.5">Configure prompt database logs architecture</p>
          </div>
        </div>

        {/* Sync choices cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Local-First */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => handleSyncToggle('local')}
            onKeyDown={(e) => handleKeyDownSync('local', e)}
            className={`border rounded-xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              syncMode === 'local' 
                ? 'border-primary bg-primary-subtle/20' 
                : 'border-border hover:border-text-secondary bg-surface-secondary/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Local-First Storage
                </span>
                <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">
                  All prompt templates and diagnostics results are encrypted locally inside your browser storage. Zero database overhead.
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                syncMode === 'local' ? 'border-primary bg-primary text-text-on-primary' : 'border-border'
              }`}>
                {syncMode === 'local' && <Check className="w-2.5 h-2.5" />}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary bg-surface px-2.5 py-1 rounded border border-border-subtle w-fit mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              Secure offline storage active
            </div>
          </div>

          {/* Card 2: Cloud Database */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => handleSyncToggle('cloud')}
            onKeyDown={(e) => handleKeyDownSync('cloud', e)}
            className={`border rounded-xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              syncMode === 'cloud' 
                ? 'border-primary bg-primary-subtle/20' 
                : 'border-border hover:border-text-secondary bg-surface-secondary/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" />
                  Cloud Database Sync
                </span>
                <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">
                  Synchronize prompt checks with cloud storage databases (D1 SQL engine) to share logs with team members.
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                syncMode === 'cloud' ? 'border-primary bg-primary text-text-on-primary' : 'border-border'
              }`}>
                {syncMode === 'cloud' && <Check className="w-2.5 h-2.5" />}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary bg-surface px-2.5 py-1 rounded border border-border-subtle w-fit mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Cloud sync simulator active
            </div>
          </div>

        </div>
      </div>

      {/* DATABASE MAINTENANCE SECTION */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Database Maintenance</h3>
            <p className="text-xs text-text-secondary mt-0.5">Manage local data backups and database clears</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">Local Storage Usage</span>
            <span className="text-text-secondary mt-0.5">{historyCount} prompt logs saved in history.</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupDownload}
              className="px-3 h-8 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
            <button
              onClick={handleClearHistory}
              className="px-3 h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
