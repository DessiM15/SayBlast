import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BUILT_IN_TEMPLATES } from "@/lib/templates/built-in-templates";
import TemplateList from "@/components/templates/template-list";

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userTemplates = await db.campaignTemplate.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      htmlTemplate: true,
      isDefault: true,
      userId: true,
    },
  });

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

  return <TemplateList builtInTemplates={builtIn} customTemplates={custom} />;
}
