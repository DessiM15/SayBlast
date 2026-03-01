"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Sparkles } from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  htmlTemplate: string;
  isDefault: boolean;
  userId: string | null;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("/api/templates");
        if (!response.ok) throw new Error("Failed to load");
        const data = (await response.json()) as { templates: TemplateItem[] };
        setTemplates(data.templates);
      } catch {
        toast.error("Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  async function handleUseTemplate(template: TemplateItem) {
    setUsingTemplateId(template.id);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Campaign from ${template.name}`,
          subjectLine: "",
          htmlBody: template.htmlTemplate,
          textBody: "",
          status: "draft",
        }),
      });

      if (!response.ok) throw new Error("Failed to create campaign");

      const data = (await response.json()) as { campaign: { id: string } };
      toast.success("Campaign created from template!");
      router.push(`/campaigns/${data.campaign.id}/edit`);
    } catch {
      toast.error("Failed to create campaign from template");
      setUsingTemplateId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  const builtInTemplates = templates.filter((t) => t.isDefault);
  const customTemplates = templates.filter((t) => !t.isDefault);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Templates</h1>
        <p className="mt-1 text-muted-foreground">
          Start with a pre-built template or use your own
        </p>
      </div>

      {/* Built-in Templates */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-[#FDA085]" />
          Built-in Templates
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builtInTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col overflow-hidden">
              <div className="h-[180px] overflow-hidden border-b bg-white">
                <iframe
                  srcDoc={template.htmlTemplate}
                  title={template.name}
                  className="h-[360px] w-[200%] origin-top-left scale-50 border-0"
                  sandbox="allow-same-origin"
                  tabIndex={-1}
                />
              </div>
              <CardHeader className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Built-in
                  </Badge>
                </div>
                {template.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <div className="px-6 pb-4">
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-white hover:opacity-90"
                  onClick={() => handleUseTemplate(template)}
                  disabled={usingTemplateId === template.id}
                >
                  {usingTemplateId === template.id ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Use Template"
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Custom Templates */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5" />
          My Templates
        </h2>
        {customTemplates.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No custom templates yet. Save a campaign as a template to see it
              here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <Card
                key={template.id}
                className="flex flex-col overflow-hidden"
              >
                <div className="h-[180px] overflow-hidden border-b bg-white">
                  <iframe
                    srcDoc={template.htmlTemplate}
                    title={template.name}
                    className="h-[360px] w-[200%] origin-top-left scale-50 border-0"
                    sandbox="allow-same-origin"
                    tabIndex={-1}
                  />
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </CardHeader>
                <div className="px-6 pb-4">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-white hover:opacity-90"
                    onClick={() => handleUseTemplate(template)}
                    disabled={usingTemplateId === template.id}
                  >
                    {usingTemplateId === template.id ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Use Template"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
