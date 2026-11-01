import { UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Shown when the signed-in account has no employee record linked to it. */
export function NotLinkedCard({ action }: { action: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserX className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Your account isn&apos;t linked to an employee record</p>
          <p className="max-w-md text-sm text-muted-foreground">
            To {action}, ask HR or your admin to open <strong>HRMS → Employees</strong>, find your
            record and choose <strong>Link user account</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
