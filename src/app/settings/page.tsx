"use client";

import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const key = localStorage.getItem("anthropic_api_key") || "";
    const savedModel = localStorage.getItem("claude_model") || "claude-sonnet-4-20250514";
    if (key) {
      setSavedKey(key.slice(0, 7) + "..." + key.slice(-4));
    }
    setModel(savedModel);
  }, []);

  function saveSettings() {
    if (apiKey.trim()) {
      localStorage.setItem("anthropic_api_key", apiKey.trim());
      setSavedKey(apiKey.trim().slice(0, 7) + "..." + apiKey.trim().slice(-4));
      setApiKey("");
    }
    localStorage.setItem("claude_model", model);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-text-dim text-sm">Configure your API keys and preferences</p>
      </header>

      {/* API Key */}
      <div className="bg-surface border border-border-subtle rounded-[20px] p-6 mb-4">
        <h2 className="font-mono text-[10px] tracking-[3px] uppercase text-text-dim mb-4">
          Anthropic API Key
        </h2>
        <p className="text-text-dim text-sm mb-4 leading-relaxed">
          Required for video analysis and content creation. Get a key at{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full bg-bg border border-border-subtle rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent/40 mb-3 transition-colors"
        />
        {savedKey && (
          <p className="text-xs text-accent-dim">
            Current key: {savedKey}
          </p>
        )}
        <p className="text-xs text-text-dim/50 mt-2">
          Note: For the hosted version, set ANTHROPIC_API_KEY as an environment variable on Vercel and Render instead.
        </p>
      </div>

      {/* Model Selection */}
      <div className="bg-surface border border-border-subtle rounded-[20px] p-6 mb-6">
        <h2 className="font-mono text-[10px] tracking-[3px] uppercase text-text-dim mb-4">
          Claude Model
        </h2>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-bg border border-border-subtle rounded-2xl px-4 py-3 text-sm outline-none text-text"
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (balanced)</option>
          <option value="claude-opus-4-20250514">Claude Opus 4 (most capable)</option>
          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fastest)</option>
        </select>
      </div>

      {/* Save */}
      <button
        onClick={saveSettings}
        className="flex items-center gap-2 bg-accent text-white rounded-2xl px-6 py-3 font-bold text-sm transition-all hover:shadow-[0_4px_24px_rgba(62,136,160,0.25)] active:scale-[0.97]"
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? "Saved!" : "Save Settings"}
      </button>

      {/* Info */}
      <div className="mt-8 bg-surface border border-border-subtle rounded-[20px] p-5">
        <p className="text-xs text-text-dim/60 leading-relaxed mb-2">
          <strong className="text-text-dim">Cost estimate:</strong> Each video analysis costs approximately $0.05-0.10
          using Sonnet. Haiku is cheaper (~$0.02/analysis) but less detailed.
        </p>
        <p className="text-xs text-text-dim/40">
          Built for studying creators, not copying them.
        </p>
      </div>
    </div>
  );
}
