"use client";

import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Mail } from "lucide-react";

interface EmailPreviewProps {
  html: string;
  subjectLine?: string;
}

export default function EmailPreview({ html, subjectLine }: EmailPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4" />
          Email Preview
        </CardTitle>
      </CardHeader>
      <div className="px-6 pb-6">
        {subjectLine && (
          <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium">{subjectLine}</span>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border bg-white">
          <iframe
            srcDoc={html || "<p style='padding:20px;color:#999;'>No content yet</p>"}
            title="Email preview"
            className="h-[500px] w-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </Card>
  );
}
