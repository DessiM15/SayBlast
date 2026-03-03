import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AudienceList from "@/components/audiences/audience-list";

export default async function AudiencesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const audienceLists = await db.audienceList.findMany({
    where: { userId: session.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { contacts: { where: { deletedAt: null } } },
      },
    },
  });

  const serialized = audienceLists.map((list) => ({
    ...list,
    createdAt: list.createdAt.toISOString(),
    updatedAt: undefined,
    deletedAt: undefined,
  }));

  return <AudienceList initialLists={serialized} />;
}
