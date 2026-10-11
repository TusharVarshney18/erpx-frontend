import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./google-icon";

export function SsoSection({ onGoogle }: { onGoogle: () => void }) {
  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={onGoogle}
        className="h-11 w-full rounded-lg border-border bg-card/60 font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
        <span className="h-px flex-1 bg-border/70" />
        or continue with email
        <span className="h-px flex-1 bg-border/70" />
      </div>
    </div>
  );
}
