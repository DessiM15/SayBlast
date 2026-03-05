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

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const firstName = session.name.split(" ")[0];

  // Fetch real stats from database
  const [totalCampaigns, emailsSent, upcoming] = await Promise.all([
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
  ]);

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
      )}
    </div>
  );
}
