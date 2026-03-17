"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserMinus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UnsubscribeOverviewProps {
  totalUnsubscribes: number;
  unsubscribesThisMonth: number;
  totalEmailsSent: number;
  monthlyData: Array<{ month: string; count: number }>;
  watchList: Array<{
    campaignId: string;
    campaignName: string;
    unsubscribeCount: number;
    sentCount: number;
  }>;
}

export default function UnsubscribeOverview({
  totalUnsubscribes,
  unsubscribesThisMonth,
  totalEmailsSent,
  monthlyData,
  watchList,
}: UnsubscribeOverviewProps) {
  const overallRate =
    totalEmailsSent > 0
      ? ((totalUnsubscribes / totalEmailsSent) * 100).toFixed(1)
      : "0.0";

  const hasChartData = monthlyData.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserMinus className="h-5 w-5 text-orange-500" />
          Unsubscribe Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {totalUnsubscribes}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Total
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {unsubscribesThisMonth}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              This Month
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {overallRate}%
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Overall Rate
            </p>
          </div>
        </div>

        {/* Bar chart — last 6 months */}
        {hasChartData && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Last 6 Months
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e4e4e7",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#FB923C"
                  radius={[4, 4, 0, 0]}
                  name="Unsubscribes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Watch list — campaigns with highest unsub rates */}
        {watchList.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Highest Unsubscribe Rates
            </p>
            <div className="flex flex-col gap-2">
              {watchList.map((item) => {
                const rate =
                  item.sentCount > 0
                    ? ((item.unsubscribeCount / item.sentCount) * 100).toFixed(
                        1
                      )
                    : "0.0";
                return (
                  <Link
                    key={item.campaignId}
                    href={`/campaigns/${item.campaignId}`}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserMinus className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      <span className="truncate text-sm font-medium">
                        {item.campaignName}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm text-orange-600 dark:text-orange-400">
                      {item.unsubscribeCount} unsubs ({rate}%)
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
