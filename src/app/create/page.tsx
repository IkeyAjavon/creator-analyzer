"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { Creator } from "@/types/database";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function CreatePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I can help you create content based on the styles you've analyzed. Try one of the quick actions above, or describe what you need.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [styleFilter, setStyleFilter] = useState("all");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then((data) => setCreators(data.creators || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  function quickAction(mode: string) {
    const prompts: Record<string, string> = {
      hooks: "Generate 10 hook variations for a video about: ",
      script: "Write a complete short-form video script about: ",
      ideas: "Give me 10 content ideas related to: ",
      calendar: "Create a 7-day content calendar focused on: ",
    };
    setInput(prompts[mode] || "");
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          style_filter: styleFilter,
          history: messages.slice(-10),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    }

    setIsLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Create</h1>
        <p className="text-text-dim text-sm">
          Generate scripts, hooks, and content ideas based on styles you&apos;ve analyzed.
        </p>
      </header>

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { key: "hooks", label: "Hook Variations" },
          { key: "script", label: "Write a Script" },
          { key: "ideas", label: "Content Ideas" },
          { key: "calendar", label: "Content Calendar" },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => quickAction(action.key)}
            className="bg-surface border border-border-subtle rounded-2xl px-4 py-2 text-xs font-medium hover:border-accent/20 transition-all"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Style filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[9px] tracking-[1px] uppercase text-text-dim/50">
          Style Reference
        </span>
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          className="bg-surface border border-border-subtle rounded-2xl px-3 py-1.5 text-sm outline-none text-text"
        >
          <option value="all">All analyzed creators</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.videos_analyzed} videos)
            </option>
          ))}
        </select>
      </div>

      {/* Chat */}
      <div
        ref={chatRef}
        className="bg-surface border border-border-subtle rounded-[20px] p-5 mb-4 max-h-[500px] overflow-y-auto"
      >
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-text"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-2 rounded-2xl px-4 py-3">
                <Loader2 size={16} className="animate-spin text-accent" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-surface border border-border-subtle rounded-[20px] p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Describe the content you want to create..."
          className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-text-dim/40"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-accent text-white rounded-2xl px-5 py-3 font-bold text-sm disabled:opacity-30 transition-all hover:shadow-[0_4px_16px_rgba(62,136,160,0.25)] flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
