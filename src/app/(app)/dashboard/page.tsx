import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CampaignStatus, SendLogStatus } from "@/generated/prisma/enums";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Megaphone, Users, FileText } from "lucide-react";
import ActivityFeed, {
  type ActivityItem,
} from "@/components/dashboard/activity-feed";
import UnsubscribeOverview from "@/components/dashboard/unsubscribe-overview";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const firstName = session.name.split(" ")[0];

  // Fetch real stats and recent activity from database
  const [
    totalCampaigns,
    emailsSent,
    upcoming,
    recentCampaigns,
    recentAudiences,
    totalUnsubscribes,
    allUnsubscribes,
    sentCampaignsForWatchList,
  ] = await Promise.all([
      db.campaign.count({
        where: { userId: session.id },
      }),
      db.sendLog.count({
        where: {
          status: SendLogStatus.sent,
          campaign: { userId: session.id },
        },
      }),
      db.campaign.count({
        where: {
          userId: session.id,
          status: CampaignStatus.scheduled,
          scheduledAt: { gt: new Date() },
        },
      }),
      db.campaign.findMany({
        where: { userId: session.id },
        orderBy: { updatedAt: "desc" },
        take: 7,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          sentAt: true,
          scheduledAt: true,
        },
      }),
      db.audienceList.findMany({
        where: { userId: session.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { contacts: true } },
        },
      }),
      db.unsubscribe.count({
        where: { userId: session.id },
      }),
      db.unsubscribe.findMany({
        where: { userId: session.id },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.campaign.findMany({
        where: {
          userId: session.id,
          status: { in: [CampaignStatus.sent, CampaignStatus.failed] },
          sentAt: { not: null },
          sentCount: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          sentCount: true,
          sentAt: true,
        },
        orderBy: { sentAt: "desc" },
        take: 20,
      }),
    ]);

  // Compute monthly unsubscribe data (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyMap = new Map<string, number>();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyMap.set(key, 0);
  }

  for (const unsub of allUnsubscribes) {
    if (unsub.createdAt >= sixMonthsAgo) {
      const key = unsub.createdAt.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }
  }

  const monthlyData = Array.from(monthlyMap, ([month, count]) => ({
    month,
    count,
  }));

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const unsubscribesThisMonth = allUnsubscribes.filter(
    (u) => u.createdAt >= startOfMonth
  ).length;

  // Compute watch list: campaigns with highest unsubscribe rates
  const watchList: Array<{
    campaignId: string;
    campaignName: string;
    unsubscribeCount: number;
    sentCount: number;
  }> = [];

  if (sentCampaignsForWatchList.length > 0 && totalUnsubscribes > 0) {
    for (const camp of sentCampaignsForWatchList) {
      if (!camp.sentAt) continue;

      const sentEmails = await db.sendLog.findMany({
        where: { campaignId: camp.id, status: "sent" },
        select: { contactEmail: true },
      });
      const sentEmailList = sentEmails.map((s) => s.contactEmail);

      if (sentEmailList.length === 0) continue;

      const unsubCount = await db.unsubscribe.count({
        where: {
          userId: session.id,
          email: { in: sentEmailList },
          createdAt: { gt: camp.sentAt },
        },
      });

      if (unsubCount > 0) {
        watchList.push({
          campaignId: camp.id,
          campaignName: camp.name,
          unsubscribeCount: unsubCount,
          sentCount: camp.sentCount,
        });
      }
    }

    watchList.sort(
      (a, b) =>
        b.unsubscribeCount / b.sentCount - a.unsubscribeCount / a.sentCount
    );
    watchList.splice(3);
  }

  // Build activity items from existing data
  const activityItems: ActivityItem[] = [];

  for (const campaign of recentCampaigns) {
    if (campaign.status === CampaignStatus.sent && campaign.sentAt) {
      activityItems.push({
        id: `sent-${campaign.id}`,
        type: "campaign_sent",
        title: `"${campaign.name}" sent`,
        description: "Campaign delivered to recipients",
        timestamp: campaign.sentAt,
        href: `/campaigns/${campaign.id}`,
      });
    } else if (
      campaign.status === CampaignStatus.scheduled &&
      campaign.scheduledAt
    ) {
      activityItems.push({
        id: `sched-${campaign.id}`,
        type: "campaign_scheduled",
        title: `"${campaign.name}" scheduled`,
        description: `Scheduled for ${campaign.scheduledAt.toLocaleDateString()}`,
        timestamp: campaign.updatedAt,
        href: `/campaigns/${campaign.id}`,
      });
    } else {
      activityItems.push({
        id: `camp-${campaign.id}`,
        type: "campaign_created",
        title: `"${campaign.name}" created`,
        description: `Status: ${campaign.status}`,
        timestamp: campaign.createdAt,
        href: `/campaigns/${campaign.id}/edit`,
      });
    }
  }

  for (const audience of recentAudiences) {
    activityItems.push({
      id: `aud-${audience.id}`,
      type: "audience_created",
      title: `"${audience.name}" created`,
      description: `${audience._count.contacts} contact${audience._count.contacts === 1 ? "" : "s"}`,
      timestamp: audience.createdAt,
      href: `/audiences/${audience.id}`,
    });
  }

  activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const topActivity = activityItems.slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create and manage your voice-powered email campaigns
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/campaigns/new">
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#F6D365] to-[#FDA085]">
                <Megaphone className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg">New Campaign</CardTitle>
              <CardDescription>
                Create a new campaign using your voice
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/audiences">
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#F6D365] to-[#FDA085]">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg">Audiences</CardTitle>
              <CardDescription>
                Manage your contact lists and audiences
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/templates">
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#F6D365] to-[#FDA085]">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg">Templates</CardTitle>
              <CardDescription>
                Browse and manage email templates
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {totalCampaigns === 0 && emailsSent === 0 && upcoming === 0 ? (
        <Card className="border-l-4 border-l-[#FDA085]">
          <CardHeader>
            <CardTitle>Get started with SayBlast</CardTitle>
            <CardDescription>
              You&apos;re all set up! Follow these steps to send your first
              campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              {
                step: 1,
                title: "Create an audience list",
                description:
                  "Import or add the contacts you want to email.",
                href: "/audiences",
              },
              {
                step: 2,
                title: "Add contacts to your list",
                description:
                  "Upload a CSV or add contacts manually.",
                href: "/audiences",
              },
              {
                step: 3,
                title: "Create your first campaign",
                description:
                  "Describe your email with your voice and send it.",
                href: "/campaigns/new",
              },
            ].map(({ step, title, description, href }) => (
              <Link
                key={step}
                href={href}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-sm font-bold text-foreground">
                  {step}
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total Campaigns</CardDescription>
                <CardTitle className="text-3xl">{totalCampaigns}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Emails Sent</CardDescription>
                <CardTitle className="text-3xl">{emailsSent}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Upcoming</CardDescription>
                <CardTitle className="text-3xl">{upcoming}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {emailsSent > 0 && (
            <UnsubscribeOverview
              totalUnsubscribes={totalUnsubscribes}
              unsubscribesThisMonth={unsubscribesThisMonth}
              totalEmailsSent={emailsSent}
              monthlyData={monthlyData}
              watchList={watchList}
            />
          )}

          <ActivityFeed items={topActivity} />
        </>
      )}
    </div>
  );
}
