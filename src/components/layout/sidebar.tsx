"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  FileText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Megaphone,
  Users,
  FileText,
  Settings,
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <Image src="/logo.svg" alt="SayBlast" width={32} height={32} />
        <span className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] bg-clip-text text-lg font-bold text-transparent">
          SayBlast
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#F6D365]/20 to-[#FDA085]/20 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
