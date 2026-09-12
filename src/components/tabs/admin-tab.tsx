import { LayoutDashboard, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminTabProps {
  destinationName: string;
}

export function AdminTab({ destinationName }: AdminTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LayoutDashboard className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Content management for {destinationName}
          </p>
          <p className="text-xs text-muted-foreground">
            Editing tools for attractions, temples, stays, and media are
            coming in a future update.
          </p>
        </CardContent>
      </Card>

      <Alert>
        <Lock className="size-4" />
        <AlertTitle>PIN protected</AlertTitle>
        <AlertDescription>
          Admin actions will require a PIN before any changes can be made.
        </AlertDescription>
      </Alert>
    </div>
  );
}
