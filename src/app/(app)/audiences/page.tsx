import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AudienceList from "@/components/audiences/audience-list";

const ALLOWED_LIMITS = [10, 25, 50, 100] as const;

export default async function AudiencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1);
  const rawLimit = parseInt(String(params.limit ?? "25"), 10) || 25;
  const limit = ALLOWED_LIMITS.includes(rawLimit as typeof ALLOWED_LIMITS[number])
    ? rawLimit
    : 25;
  const skip = (page - 1) * limit;

  const [audienceLists, total] = await Promise.all([
    db.audienceList.findMany({
      where: { userId: session.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contacts: { where: { deletedAt: null } } },
        },
      },
      take: limit,
      skip,
    }),
    db.audienceList.count({
      where: { userId: session.id, deletedAt: null },
    }),
  ]);

  const serialized = audienceLists.map((list) => ({
    ...list,
    createdAt: list.createdAt.toISOString(),
    updatedAt: undefined,
    deletedAt: undefined,
  }));

  return (
    <AudienceList
      initialLists={serialized}
      initialPagination={{
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }}
    />
  );
}
