import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Users, Calendar, Mail, CheckCircle2 } from "lucide-react";

interface CampaignInfoGridProps {
  campaign: {
    audienceList: { name: string } | null;
    sentAt: string | null;
    scheduledAt: string | null;
    totalRecipients: number;
    createdAt: string;
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function CampaignInfoGrid({ campaign }: CampaignInfoGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            Audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {campaign.audienceList?.name ?? "No audience"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {campaign.sentAt ? "Sent At" : "Scheduled For"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {campaign.sentAt
              ? formatDate(campaign.sentAt)
              : campaign.scheduledAt
                ? formatDate(campaign.scheduledAt)
                : "Not scheduled"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            Recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {campaign.totalRecipients}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Created
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {formatDate(campaign.createdAt)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
