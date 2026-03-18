"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Plus, X } from "lucide-react";
import type { Category } from "@/types/database";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#c4f042");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc, color: newColor }),
      });
      setNewName("");
      setNewDesc("");
      setNewColor("#c4f042");
      setShowCreate(false);
      loadCategories();
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Categories</h1>
          <p className="text-text-dim text-sm">
            Organize your video library by content type
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 bg-surface border border-border-subtle rounded-2xl px-4 py-2.5 text-sm hover:border-accent/20 transition-all"
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          {showCreate ? "Cancel" : "New"}
        </button>
      </header>

      {/* Create form */}
      {showCreate && (
        <div className="bg-surface border border-border-subtle rounded-[20px] p-5 mb-6 animate-fade-up">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="w-full bg-bg border border-border-subtle rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent/40 mb-3 transition-colors"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-bg border border-border-subtle rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent/40 mb-3 transition-colors"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-dim">Color</label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-8 h-8 border border-border-subtle rounded-lg cursor-pointer"
            />
            <button
              onClick={handleCreate}
              className="ml-auto bg-accent text-white rounded-2xl px-6 py-2.5 text-sm font-bold hover:shadow-[0_4px_20px_rgba(62,136,160,0.25)] transition-all"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-[20px] p-5 animate-pulse">
              <div className="h-4 bg-surface-2 rounded w-32 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-48" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={36} className="mx-auto text-text-dim mb-4 opacity-20" />
          <p className="text-text-dim text-sm">No categories yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-surface border border-border-subtle rounded-[20px] p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: cat.color }}
                />
                <div>
                  <h3 className="font-medium text-sm">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-text-dim mt-0.5">{cat.description}</p>
                  )}
                </div>
              </div>
              <span className="font-mono text-xs text-text-dim/60">
                {cat.video_count} video{cat.video_count !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
