import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendLogStatus } from "@/generated/prisma/client";

export interface SendLogEntry {
  id: string;
  contactEmail: string;
  status: string;
  error: string | null;
  sentAt: string;
}

interface SendLogTableProps {
  entries: SendLogEntry[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function SendLogTable({ entries }: SendLogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send Log</CardTitle>
        <CardDescription>{entries.length} entries</CardDescription>
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
                    {log.contactEmail}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant="secondary"
                      className={
                        log.status === SendLogStatus.sent
                          ? "bg-green-100 text-green-800"
                          : log.status === SendLogStatus.skipped_cooldown
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
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
      </CardContent>
    </Card>
  );
}
