import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BUILT_IN_TEMPLATES } from "@/lib/templates/built-in-templates";
import TemplateList from "@/components/templates/template-list";

const ALLOWED_LIMITS = [10, 25, 50, 100] as const;

export default async function TemplatesPage({
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

  const [userTemplates, customTotal] = await Promise.all([
    db.campaignTemplate.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        htmlTemplate: true,
        isDefault: true,
        userId: true,
      },
      take: limit,
      skip,
    }),
    db.campaignTemplate.count({
      where: { userId: session.id },
    }),
  ]);

  const builtIn = BUILT_IN_TEMPLATES.map((t, index) => ({
    id: `built-in-${index}`,
    name: t.name,
    description: t.description,
    htmlTemplate: t.htmlTemplate,
    isDefault: true as const,
    userId: null,
  }));

  const custom = userTemplates.map((t) => ({
    ...t,
    description: undefined,
  }));

  return (
    <TemplateList
      builtInTemplates={builtIn}
      customTemplates={custom}
      initialPagination={{
        page,
        limit,
        total: customTotal,
        totalPages: Math.ceil(customTotal / limit),
      }}
    />
  );
}
