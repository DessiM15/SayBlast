"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import CampaignList from "@/components/campaigns/campaign-list";
import type { CampaignListItem } from "@/components/campaigns/campaign-list";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function CampaignsPage() {
  const PAGE_SIZE = 25;
  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "error">("loading");
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0,
  });

  const loadCampaigns = useCallback(async (page: number) => {
    try {
      const response = await fetch(`/api/campaigns?page=${page}&pageSize=${PAGE_SIZE}`);
      if (!response.ok) {
        setPageStatus("error");
        return;
      }
      const data = (await response.json()) as {
        campaigns: CampaignListItem[];
        pagination: Pagination;
      };
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
      setPageStatus("ready");
    } catch {
      setPageStatus("error");
    }
  }, []);

  useEffect(() => {
    loadCampaigns(pagination.page);
  }, [pagination.page, loadCampaigns]);

  function handlePageChange(newPage: number) {
    setPagination((prev) => ({ ...prev, page: newPage }));
    setPageStatus("loading");
  }

  if (pageStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageStatus === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Failed to load campaigns.</p>
        <Button variant="outline" onClick={() => loadCampaigns(pagination.page)}>
          Retry
        </Button>
      </div>
    );
  }

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

      <CampaignList
        campaigns={campaigns}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
