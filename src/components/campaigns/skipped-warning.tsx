import { ShieldOff } from "lucide-react";

interface SkippedWarningProps {
  skippedCount: number;
}

export default function SkippedWarning({ skippedCount }: SkippedWarningProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4">
      <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
      <div>
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          All recipients were skipped
        </p>
        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
          All {skippedCount} recipient(s) were within the 72-hour
          anti-spam cooldown. No emails were delivered. Try again after the
          cooldown period expires.
        </p>
      </div>
    </div>
  );
}
