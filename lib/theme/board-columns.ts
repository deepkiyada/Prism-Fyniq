import type { BoardStage } from "@/lib/types";

/** Accent styles for kanban column headers — tied to the primary violet palette. */
export const boardColumnStyles: Record<
  BoardStage,
  { column: string; header: string; dot: string }
> = {
  ongoing_services: {
    column: "border-t-primary/80 bg-primary/[0.06]",
    header: "text-primary",
    dot: "bg-primary",
  },
  draft: {
    column: "border-t-highlight bg-highlight/50",
    header: "text-highlight-foreground",
    dot: "bg-highlight-foreground",
  },
  sent: {
    column: "border-t-info bg-info-muted",
    header: "text-info",
    dot: "bg-info",
  },
  paid: {
    column: "border-t-success bg-success-muted",
    header: "text-success",
    dot: "bg-success",
  },
  done: {
    column: "border-t-border bg-muted/60",
    header: "text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};
