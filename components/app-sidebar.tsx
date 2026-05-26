"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  FileSpreadsheet,
  Kanban,
  LogOut,
  Shield,
  Users2,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
  isSuperAdmin?: boolean;
};

const links = [
  { href: "/", label: "Monthly board", icon: Kanban },
  { href: "/clients", label: "Clients", icon: Users2 },
  { href: "/exports", label: "Exports", icon: FileSpreadsheet },
];

function getInitials(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email?.split("@")[0] || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AppSidebar({
  userName,
  userEmail,
  isSuperAdmin = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const navLinks = isSuperAdmin
    ? [...links, { href: "/users", label: "Users", icon: Shield }]
    : links;
  const initials = getInitials(userName, userEmail);
  const displayName = userName?.trim() || userEmail?.split("@")[0] || "User";

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-3 h-auto px-1 opacity-100 group-data-[collapsible=icon]:opacity-0">
            <BrandMark subtitle="Agency Billing" />
          </SidebarGroupLabel>
          <SidebarSeparator className="mb-2" />
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wide text-primary/70 group-data-[collapsible=icon]:opacity-0">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="rounded-xl text-muted-foreground hover:text-foreground data-[active=true]:bg-primary/12 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary/20 data-[active=true]:shadow-xs"
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator className="mb-2" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={displayName}
              className="h-12 rounded-lg border bg-card text-foreground hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail ?? "Signed in"}
                </p>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail ?? "Signed in"}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/auth/logout">
                <LogOut />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
