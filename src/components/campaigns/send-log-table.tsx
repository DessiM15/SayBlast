import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SendLogStatus } from "@/generated/prisma/enums";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SendLogEntry {
  id: string;
  contactEmail: string;
  status: string;
  error: string | null;
  sentAt: string;
}

interface SendLogTableProps {
  entries: SendLogEntry[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  unsubscribedEmails?: string[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function SendLogTable({
  entries,
  page,
  pageSize,
  total,
  onPageChange,
  unsubscribedEmails = [],
}: SendLogTableProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);
  const unsubscribedSet = new Set(unsubscribedEmails);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send Log</CardTitle>
        <CardDescription>
          Showing {start}–{end} of {total} entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      {log.contactEmail}
                      {unsubscribedSet.has(log.contactEmail) && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-[10px] px-1.5 py-0"
                        >
                          Unsubscribed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant="secondary"
                      className={
                        log.status === SendLogStatus.sent
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : log.status === SendLogStatus.skipped_cooldown
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {log.status === SendLogStatus.skipped_cooldown
                        ? "skipped"
                        : log.status}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">
                    {formatDate(log.sentAt)}
                  </td>
                  <td className="py-2 text-xs text-destructive">
                    {log.error ?? "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
