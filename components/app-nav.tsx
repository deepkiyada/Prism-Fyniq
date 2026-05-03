"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Overview" },
  { href: "/clients", label: "Clients" },
  { href: "/schedules", label: "Schedules" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
  { href: "/exports", label: "Exports" },
];

type AppNavProps = {
  userEmail?: string | null;
  isSuperAdmin?: boolean;
};

export function AppNav({ userEmail, isSuperAdmin = false }: AppNavProps) {
  const pathname = usePathname();
  const navLinks = isSuperAdmin ? [...links, { href: "/users", label: "Users" }] : links;

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <nav className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Button
              key={link.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8", isActive ? "shadow-xs" : "text-muted-foreground")}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 md:justify-end">
        <p className="truncate text-xs text-muted-foreground">{userEmail ?? "Signed in"}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/auth/logout">Sign out</Link>
        </Button>
      </div>
    </div>
  );
}
