import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Megaphone, Users, Upload, Send, Clock } from "lucide-react";

export type ActivityItemType =
  | "campaign_created"
  | "campaign_sent"
  | "campaign_scheduled"
  | "audience_created"
  | "contacts_uploaded";

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  title: string;
  description: string;
  timestamp: Date;
  href: string;
}

const ICON_MAP: Record<ActivityItemType, typeof Megaphone> = {
  campaign_created: Megaphone,
  campaign_sent: Send,
  campaign_scheduled: Clock,
  audience_created: Users,
  contacts_uploaded: Upload,
};

interface ActivityFeedProps {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No activity yet. Create your first campaign to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.type];
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#F6D365] to-[#FDA085]">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
