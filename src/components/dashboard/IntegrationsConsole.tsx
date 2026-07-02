import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Terminal, 
  Code
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyString: string;
  created: number;
}

export default function IntegrationsConsole() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aiq_api_keys');
      if (stored) {
        setApiKeys(JSON.parse(stored));
      } else {
        const seedKeys = [
          {
            id: 'key-1',
            name: 'Production Server Token',
            keyString: 'aq_live_83b10da2e9fc468eb90f488f2868ff1c',
            created: Date.now() - 3600000 * 24 * 7 // 7 days ago
          }
        ];
        localStorage.setItem('aiq_api_keys', JSON.stringify(seedKeys));
        setApiKeys(seedKeys);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey: ApiKey = {
      id: 'key-' + Math.random().toString(36).substring(2, 9),
      name: newKeyName.trim(),
      keyString: `aq_live_${randomHex}`,
      created: Date.now()
    };

    try {
      const updated = [...apiKeys, newKey];
      localStorage.setItem('aiq_api_keys', JSON.stringify(updated));
      setApiKeys(updated);
      setNewKeyName('');
    } catch (e) {
      // Ignore
    }
  };

  const handleDeleteKey = (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using this token will lose access.')) return;
    
    try {
      const updated = apiKeys.filter(k => k.id !== id);
      localStorage.setItem('aiq_api_keys', JSON.stringify(updated));
      setApiKeys(updated);
    } catch (e) {
      // Ignore
    }
  };

  const copyToClipboard = (id: string, text: string, type: 'key' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } else {
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 1500);
    }
  };

  const curlCode = `curl -X POST https://api.aiqualityhq.com/v1/analyze \\
  -H "Authorization: Bearer ${apiKeys[0]?.keyString || 'aq_live_your_token_here'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "You are a translator. Translate this: {{input}}"}'`;

  const nodeCode = `const response = await fetch('https://api.aiqualityhq.com/v1/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKeys[0]?.keyString || 'aq_live_your_token_here'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "You are a translator. Translate this: {{input}}"
  })
});

const result = await response.json();
console.log(\`Overall Quality Score: \${result.overallScore}/100\`);`;

  const githubYml = `name: AI Prompt Quality Check
on: [pull_request]

jobs:
  audit-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install -g tsx
      - name: Audit prompt files
        run: npx tsx bin/aiq-check.ts prompts/system-prompt.txt --threshold 70`;

  return (
    <div className="flex flex-col gap-8 max-w-[900px]">
      
      {/* API KEYS MANAGER CARD */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Developer API Keys</h3>
            <p className="text-xs text-text-secondary mt-0.5">Generate and manage secrets for remote Quality API requests</p>
          </div>
        </div>

        {/* List of keys */}
        {apiKeys.length === 0 ? (
          <p className="text-xs text-text-secondary italic">No developer API keys active. Generate a key below.</p>
        ) : (
          <div className="overflow-x-auto border border-border-subtle rounded-lg bg-surface-secondary/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-mono text-text-secondary uppercase tracking-wider h-8 px-3">
                  <th className="py-2 pl-3 font-medium">Name</th>
                  <th className="py-2 font-medium">Token Secret</th>
                  <th className="py-2 font-medium">Created</th>
                  <th className="py-2 text-right pr-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {apiKeys.map(key => (
                  <tr key={key.id} className="h-10 hover:bg-surface-secondary/40 transition-fast font-sans text-text-secondary">
                    <td className="py-2 pl-3 font-medium text-text-primary">{key.name}</td>
                    <td className="py-2 font-mono select-all text-xs">{key.keyString.substring(0, 15)}…</td>
                    <td className="py-2 text-[11px] font-mono">{new Date(key.created).toLocaleDateString()}</td>
                    <td className="py-2 text-right pr-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyToClipboard(key.id, key.keyString, 'key')}
                          className="p-1 text-text-secondary hover:text-primary rounded hover:bg-surface-secondary transition-fast cursor-pointer"
                          title="Copy Full Token"
                          aria-label={copiedId === key.id ? "Token copied" : "Copy API token"}
                        >
                          {copiedId === key.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-1 text-text-secondary hover:text-red-600 rounded hover:bg-red-500/10 transition-fast cursor-pointer"
                          title="Revoke Token"
                          aria-label="Revoke API token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
 
        {/* Key generator form */}
        <form onSubmit={handleGenerateKey} className="flex gap-2 items-end mt-2 max-w-md w-full">
          <div className="flex flex-col gap-1.5 flex-grow">
            <label htmlFor="key-description" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">Key Description</label>
            <input
              id="key-description"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Webhook"
              className="h-9 px-3 bg-surface border border-border rounded-md text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="h-9 px-4 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center justify-center gap-1.5 cursor-pointer button-press shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Token</span>
          </button>
        </form>
      </div>

      {/* INTEGRATIONS GUIDES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: REST API (Curl / Node) */}
        <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">REST API (POST)</h3>
          </div>
          
          <div className="flex flex-col gap-3 font-sans text-xs">
            <p className="text-text-secondary leading-relaxed">
              Send prompt templates programmatically to get overall scores and dimensions metrics.
            </p>
            
            {/* Curl Block */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono">
                <span>cURL (Terminal)</span>
                <button 
                  onClick={() => copyToClipboard('curl', curlCode, 'code')}
                  className="hover:text-text-primary text-[10px] flex items-center gap-1 cursor-pointer font-sans"
                >
                  {copiedText === 'curl' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText === 'curl' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-surface-secondary/40 border border-border-subtle rounded-lg font-mono text-[10px] overflow-x-auto leading-normal text-text-secondary whitespace-pre">
                {curlCode}
              </pre>
            </div>

            {/* Node JS Block */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono">
                <span>Node.js Fetch</span>
                <button 
                  onClick={() => copyToClipboard('node', nodeCode, 'code')}
                  className="hover:text-text-primary text-[10px] flex items-center gap-1 cursor-pointer font-sans"
                >
                  {copiedText === 'node' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'node' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-surface-secondary/40 border border-border-subtle rounded-lg font-mono text-[10px] overflow-x-auto leading-normal text-text-secondary whitespace-pre">
                {nodeCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Box 2: CLI / GitHub Action */}
        <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Terminal className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Terminal CLI & GitHub Actions</h3>
          </div>

          <div className="flex flex-col gap-3 font-sans text-xs">
            <p className="text-text-secondary leading-relaxed">
              Verify files in local git review loops or fail code pull requests if scores miss thresholds.
            </p>

            {/* CLI run guidelines */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase font-semibold text-text-secondary">Run CLI Locally</span>
              <pre className="p-3 bg-surface-secondary/40 border border-border-subtle rounded-lg font-mono text-[10px] text-text-secondary whitespace-pre">
                npx tsx bin/aiq-check.ts prompts/system.txt --threshold 70
              </pre>
            </div>

            {/* GitHub Actions workflow file */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono">
                <span>.github/workflows/ai-quality.yml</span>
                <button 
                  onClick={() => copyToClipboard('yml', githubYml, 'code')}
                  className="hover:text-text-primary text-[10px] flex items-center gap-1 cursor-pointer font-sans"
                >
                  {copiedText === 'yml' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'yml' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-surface-secondary/40 border border-border-subtle rounded-lg font-mono text-[10px] overflow-x-auto leading-normal text-text-secondary whitespace-pre-wrap">
                {githubYml}
              </pre>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
