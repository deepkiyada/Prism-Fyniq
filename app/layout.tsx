import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Inter } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getCurrentUserRole } from "@/lib/authz";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const manropeHeading = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prism Fyniq Invoice Management",
  description:
    "Simple workflow to manage clients, invoices, payments, and exports.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await getCurrentUserRole(user.id) : "user";
  const userName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : (user?.email?.split("@")[0] ?? "User");

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        manropeHeading.variable,
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          {user ? (
            <SidebarProvider>
              <AppSidebar
                userName={userName}
                userEmail={user.email}
                isSuperAdmin={role === "super_admin"}
              />
              <SidebarInset>
                <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 md:px-6">
                  <SidebarTrigger />
                  <p className="text-sm font-medium text-muted-foreground">
                    Prism Fyniq
                  </p>
                </header>
                <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
              {children}
            </div>
          )}
        </TooltipProvider>
      </body>
    </html>
  );
}
