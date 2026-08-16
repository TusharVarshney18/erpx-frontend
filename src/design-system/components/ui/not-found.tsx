import { FileSearch } from "lucide-react";
import { Button } from "./button";

interface NotFoundProps {
  title?: string;
  message?: string;
  onBack?: () => void;
}

export function NotFound({
  title = "Page not found",
  message = "The page you are looking for does not exist or has been moved.",
  onBack,
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <FileSearch className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center max-w-sm">
        <h1 className="text-h2">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onBack && (
        <Button variant="default" size="sm" onClick={onBack}>
          Go Back
        </Button>
      )}
    </div>
  );
}
