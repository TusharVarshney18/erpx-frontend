import { Link } from "@tanstack/react-router";
import { BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeHeaderProps {
  userName: string;
  organization: string;
  onAIAssistant?: () => void;
}

/** Executive page header: greeting, context line and primary actions. */
export function WelcomeHeader({ userName, organization, onAIAssistant }: WelcomeHeaderProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const date = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
            Live
          </span>
          <span>{date}</span>
        </div>
        <h1 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
          {greeting}, <span className="text-gradient">{userName}</span>
        </h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          Here&apos;s how <span className="font-medium text-foreground">{organization}</span> is
          doing today.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button variant="outline" asChild className="h-10 rounded-xl">
          <Link to="/reports/financial">
            <BarChart3 className="h-4 w-4" /> Reports
          </Link>
        </Button>
        <Button
          onClick={onAIAssistant}
          className="shine h-10 rounded-xl px-4 gradient-ai shadow-[0_6px_16px_-6px_rgb(124_92_255/0.6)] hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" /> Ask ERPX AI
        </Button>
      </div>
    </div>
  );
}
