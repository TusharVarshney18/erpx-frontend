import { cn } from "@/lib/utils";

const LEVELS: { label: string; bar: string; text: string }[] = [
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Good", bar: "bg-info", text: "text-info" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
];

function getPasswordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function PasswordStrength({ password }: { password: string }) {
  const score = getPasswordScore(password);
  const level = LEVELS[score];
  return (
    <div className="space-y-1.5" aria-live="polite">
      {password && (
        <>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-border/70 transition-colors duration-300",
                  i < score && level.bar,
                )}
              />
            ))}
          </div>
          <p className={cn("text-[11px] font-medium", level.text)}>
            Password strength: {level.label}
          </p>
        </>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Use at least 8 characters with a mix of letters, numbers and symbols.
      </p>
    </div>
  );
}
