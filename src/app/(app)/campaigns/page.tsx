import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CampaignList from "@/components/campaigns/campaign-list";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const campaigns = await db.campaign.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      subjectLine: true,
      updatedAt: true,
      audienceList: {
        select: { name: true },
      },
    },
  });

  const serialized = campaigns.map((c) => ({
    ...c,
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track your email campaigns
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
        >
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <CampaignList campaigns={serialized} />
    </div>
  );
}
