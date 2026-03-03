"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CampaignStatus } from "@/generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Calendar, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface CampaignListItem {
  id: string;
  name: string;
  status: string;
  subjectLine: string | null;
  updatedAt: string;
  audienceList?: { name: string } | null;
}

interface CampaignListProps {
  campaigns: CampaignListItem[];
}

const STATUS_FILTERS = ["all", CampaignStatus.draft, CampaignStatus.scheduled, CampaignStatus.sent] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_STYLES: Record<string, string> = {
  [CampaignStatus.draft]: "bg-muted text-muted-foreground",
  [CampaignStatus.scheduled]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [CampaignStatus.sending]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [CampaignStatus.sent]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [CampaignStatus.failed]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function CampaignList({ campaigns }: CampaignListProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered =
    filter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === filter);

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Megaphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">No campaigns yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first campaign using voice or text
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90">
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all ${
              filter === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No {filter} campaigns
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}/edit`}
              className="group"
            >
              <Card className="transition-all hover:border-[#FDA085]/50 hover:shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {campaign.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={`text-xs capitalize ${STATUS_STYLES[campaign.status] ?? ""}`}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.subjectLine && (
                      <CardDescription className="line-clamp-1">
                        {campaign.subjectLine}
                      </CardDescription>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeader>
                <div className="flex items-center gap-3 px-6 pb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(campaign.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {campaign.audienceList && (
                    <span>{campaign.audienceList.name}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
