"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Clock,
  BarChart3,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Calculator,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useChairStore } from "@/store/chairStore";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quick-debate", label: "Quick Debate", icon: Zap },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/awards", label: "Awards", icon: Award },
  { href: "/compare-chairs", label: "Compare Chairs", icon: GitCompare },
  { href: "/combined-scores", label: "Combined Scores", icon: Calculator },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const activeChairId = useChairStore((s) => s.activeChairId);
  const chairs = useChairStore((s) => s.chairs);
  const logout = useChairStore((s) => s.logout);

  const activeChair = chairs.find((c) => c.id === activeChairId);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-40",
          "bg-surface/80 backdrop-blur-xl border-r border-border/30",
          "transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Logo / Chair Name */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border/30">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <span className="text-accent font-bold text-sm">
              {activeChair?.name.charAt(0).toUpperCase() || "M"}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-sm truncate block">
                {activeChair?.name || "Committee Scorer"}
              </span>
              <span className="text-[10px] text-muted truncate block">MUN Scorer</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "text-sm font-medium",
                  isActive
                    ? "bg-accent/15 text-accent glow-accent"
                    : "text-muted-light hover:text-foreground hover:bg-surface-hover"
                )}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 space-y-1">
          {/* Switch chair / logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors text-sm"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Switch Chair</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-sm"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border/30">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                  isActive ? "text-accent" : "text-muted"
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
