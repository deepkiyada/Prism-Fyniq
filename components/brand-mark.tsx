import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  subtitle?: string;
};

export function BrandMark({ className, subtitle = "Invoice Operations Console" }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        PF
      </div>
      <div>
        <p className="font-semibold tracking-tight">Prism Fyniq</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
