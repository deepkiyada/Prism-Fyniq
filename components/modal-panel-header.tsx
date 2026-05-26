import type { LucideIcon } from "lucide-react";
import { modalHeader } from "@/lib/theme/ui-styles";
import { cn } from "@/lib/utils";

type ModalPanelHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function ModalPanelHeader({
  icon: Icon,
  title,
  description,
  className,
  children,
}: ModalPanelHeaderProps) {
  return (
    <div className={cn("border-b border-primary/10 px-4 py-4", modalHeader, className)}>
      <div className="flex items-start gap-3 pr-10">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="mt-4 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
