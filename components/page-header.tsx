import { cn } from "@/lib/utils";
import { pageDescription, pageTitle } from "@/lib/theme/ui-styles";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <section className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className={pageTitle}>{title}</h1>
        {description ? <p className={pageDescription}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
