"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { LayoutDashboard, BarChart3, Timer } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "ML Analytics", href: "/ml-analytics", icon: BarChart3 },
  { name: "Lap Prediction", href: "/predict", icon: Timer },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-gray-800 h-screen flex flex-col">
      <div className="p-4 text-xl font-bold text-center border-b border-gray-800 text-white tracking-wide">
        F1 ML Dashboard
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",
                active
                  ? "bg-red-600/80 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-red-600/30"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 text-center text-gray-500 text-xs">
        © 2025 F1 ML App
      </div>
    </aside>
  );
}
