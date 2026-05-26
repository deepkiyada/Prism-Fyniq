import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Inter } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalFlashToaster } from "@/components/global-flash-toaster";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getSupabaseConfigStatus, isSupabaseFetchError } from "@/lib/supabase/config";
import { checkSupabaseReachability } from "@/lib/supabase/reachability";
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
  const config = getSupabaseConfigStatus();
  let user = null;
  let role: Awaited<ReturnType<typeof getCurrentUserRole>> = "user";

  if (config.ok) {
    const reachability = await checkSupabaseReachability(config.env.url);

    if (reachability.ok) {
      try {
        const supabase = await createServerAuthClient();
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error && isSupabaseFetchError(error)) {
          user = null;
        } else {
          user = authUser;
          role = user ? await getCurrentUserRole(user.id) : "user";
        }
      } catch (error) {
        if (!isSupabaseFetchError(error)) {
          throw error;
        }
      }
    }
  }

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
      <body className="min-h-full overflow-x-hidden bg-background text-foreground">
        <TooltipProvider>
          {user ? (
            <SidebarProvider className="overflow-x-hidden">
              <AppSidebar
                userName={userName}
                userEmail={user.email}
                isSuperAdmin={role === "super_admin"}
              />
              <SidebarInset className="min-w-0 overflow-x-hidden">
                <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center gap-2 border-b border-primary/10 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 md:px-6">
                  <SidebarTrigger className="text-primary hover:bg-accent hover:text-accent-foreground" />
                  <p className="text-sm font-semibold text-primary">Prism Fyniq</p>
                </header>
                <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 py-6 md:px-8">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
              {children}
            </div>
          )}
          <Toaster richColors position="top-right" closeButton />
          <GlobalFlashToaster />
          <Analytics />
        </TooltipProvider>
      </body>
    </html>
  );
}
