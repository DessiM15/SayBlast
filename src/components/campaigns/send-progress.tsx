import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, ShieldOff, AlertTriangle } from "lucide-react";

interface SendProgressProps {
  sentCount: number;
  skippedCount: number;
  totalRecipients: number;
}

export default function SendProgress({
  sentCount,
  skippedCount,
  totalRecipients,
}: SendProgressProps) {
  const failedCount = totalRecipients - sentCount - skippedCount;
  const progressPercent =
    totalRecipients > 0
      ? Math.round(
          ((sentCount + skippedCount + Math.max(0, failedCount)) /
            totalRecipients) *
            100
        )
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="flex h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            >
              {sentCount > 0 && (
                <div
                  className="bg-green-500"
                  style={{
                    width: `${(sentCount / totalRecipients) * 100}%`,
                  }}
                />
              )}
              {skippedCount > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{
                    width: `${(skippedCount / totalRecipients) * 100}%`,
                  }}
                />
              )}
              {failedCount > 0 && (
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(failedCount / totalRecipients) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
            <div className="flex items-center justify-center gap-1 text-green-700 dark:text-green-300">
              <Mail className="h-4 w-4" />
              <span className="text-xl font-bold">{sentCount}</span>
            </div>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">Sent</p>
          </div>
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3">
            <div className="flex items-center justify-center gap-1 text-yellow-700 dark:text-yellow-300">
              <ShieldOff className="h-4 w-4" />
              <span className="text-xl font-bold">{skippedCount}</span>
            </div>
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">Skipped (Cooldown)</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3">
            <div className="flex items-center justify-center gap-1 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xl font-bold">{Math.max(0, failedCount)}</span>
            </div>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Failed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
