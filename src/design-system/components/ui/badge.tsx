import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border border-border",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        info: "bg-info/10 text-info border border-info/20",
        outline: "border border-border text-foreground",
        premium: "bg-gradient-to-r from-primary/10 to-ai/10 text-primary border border-primary/20",
        dot: "bg-background border border-border text-foreground relative pl-5",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: "success" | "warning" | "error" | "info" | "neutral";
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  const dotColors = {
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-destructive",
    info: "bg-info",
    neutral: "bg-muted-foreground",
  };

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {variant === "dot" && dot && (
        <span className={cn("absolute left-2 h-1.5 w-1.5 rounded-full", dotColors[dot])} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
