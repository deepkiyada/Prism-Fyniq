import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardHeaderTone, type CardHeaderTone } from "@/lib/theme/ui-styles";
import { cn } from "@/lib/utils";

type ThemedCardProps = {
  title: string;
  description?: string;
  tone?: CardHeaderTone;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
};

export function ThemedCard({
  title,
  description,
  tone = "primary",
  className,
  headerClassName,
  children,
}: ThemedCardProps) {
  return (
    <Card className={cn("ring-primary/10", className)}>
      <CardHeader className={cn(cardHeaderTone[tone], headerClassName)}>
        <CardTitle className="text-primary">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
