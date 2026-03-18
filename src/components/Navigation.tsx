"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Library,
  Users,
  FolderOpen,
  MessageSquare,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Analyze", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/categories", label: "Categories", icon: FolderOpen },
  { href: "/create", label: "Create", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-[220px] bg-bg border-r border-border-subtle min-h-screen px-4 py-6 gap-1">
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Search size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Creator Analyzer</span>
        </div>

        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-surface-2 text-text shadow-[inset_0_0_0_1px_rgba(62,136,160,0.15)]"
                    : "text-text-dim hover:text-text hover:bg-surface"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-xl border-t border-border-subtle flex justify-around py-3 px-2 safe-area-bottom">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? "text-accent" : "text-text-dim"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
