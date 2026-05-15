"use client";

import Link from "next/link";
import { Calendar, Home, Leaf } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/all", label: "カレンダー", icon: Calendar },
  { href: "/plant", label: "植物", icon: Leaf },
] as const;

export function BottomNav({ currentPath }: { currentPath: "/" | "/all" | "/plant" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === currentPath;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-3 ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
