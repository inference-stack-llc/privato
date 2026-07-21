"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDot, LayoutDashboard, LibraryBig, MessageCircleMore, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/circles", label: "Circles", icon: CircleDot },
  { href: "/vault", label: "Vault", icon: LibraryBig },
  { href: "/ask", label: "Ask Privato", icon: MessageCircleMore },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
        return <Link key={href} href={href} className={cn("nav-item", active && "nav-item-active")} aria-current={active ? "page" : undefined}><Icon size={19} /><span>{label}</span></Link>;
      })}
      <Link className="nav-add" href="/add"><Plus size={17} /><span>Add resource</span></Link>
    </nav>
  );
}
