import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Inter } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppNav } from "@/components/app-nav";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const manropeHeading = Manrope({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prism Labs Invoice Management",
  description: "Simple workflow to manage clients, invoices, payments, and exports.",
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

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, manropeHeading.variable)}
    >
      <body className="min-h-full bg-background text-foreground">
        {user ? (
          <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
            <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tracking-tight">Prism Labs</p>
                  <p className="text-xs text-muted-foreground">Invoice Operations Console</p>
                </div>
              </div>
              <AppNav userEmail={user.email} />
            </header>
          </div>
        ) : null}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </body>
    </html>
  );
}
