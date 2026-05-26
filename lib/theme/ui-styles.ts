/** Shared Tailwind class groups for primary-tinted UI surfaces. */

export const pageTitle =
  "bg-gradient-to-r from-primary via-highlight-foreground to-info bg-clip-text text-xl font-semibold text-transparent";

export const pageDescription = "text-sm text-muted-foreground";

export const cardHeaderTone = {
  primary: "border-b border-primary/15 bg-primary/[0.06]",
  accent: "border-b border-primary/15 bg-accent/50",
  highlight: "border-b border-primary/15 bg-highlight/55",
  info: "border-b border-info/20 bg-info-muted",
} as const;

export type CardHeaderTone = keyof typeof cardHeaderTone;

export const modalContent =
  "border-primary/15 ring-primary/15 sm:max-w-lg max-h-[90vh] overflow-y-auto";

export const modalHeader =
  "border-b border-primary/10 bg-gradient-to-r from-primary/8 via-highlight/45 to-info-muted/40";

export const sheetHeader =
  "border-b border-primary/10 bg-gradient-to-r from-primary/8 via-highlight/45 to-info-muted/40";

export const sheetFooter =
  "border-t border-primary/10 bg-highlight/35";

export const tableRowHover = "hover:bg-accent/40";

export const textLink =
  "text-link font-medium text-primary underline-offset-4 hover:text-highlight-foreground hover:underline";
