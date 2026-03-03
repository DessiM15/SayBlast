"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Mail, Target, Volume2, Zap, List, Loader2 } from "lucide-react";
import type { CampaignGeneration } from "@/lib/ai/process-transcript";

interface ReviewPanelProps {
  campaign: CampaignGeneration;
  onSave: (selectedSubjectLine: string) => Promise<void>;
}

export default function ReviewPanel({ campaign, onSave }: ReviewPanelProps) {
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const selectedSubject = campaign.subjectLines[selectedSubjectIndex] ?? campaign.subjectLines[0] ?? "";
      await onSave(selectedSubject);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Subject Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Subject Lines
          </CardTitle>
          <CardDescription>Click to select a subject line</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-2 px-6 pb-6">
          {campaign.subjectLines.map((subject, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedSubjectIndex(index)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                selectedSubjectIndex === index
                  ? "border-[#FDA085] bg-gradient-to-r from-[#F6D365]/10 to-[#FDA085]/10"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  selectedSubjectIndex === index
                    ? "border-[#FDA085] bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground"
                    : "border-muted-foreground/30"
                }`}
              >
                {selectedSubjectIndex === index && (
                  <Check className="h-3 w-3" />
                )}
              </div>
              <span>{subject}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Campaign Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Audience</p>
              <p className="text-sm">{campaign.targetAudience}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tone</p>
              <p className="text-sm">{campaign.tone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">CTA</p>
              <p className="text-sm">{campaign.cta}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <List className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Key Points</p>
              <div className="flex flex-wrap gap-1">
                {campaign.keyPoints.map((point, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Preview</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-lg border bg-white">
            <iframe
              srcDoc={campaign.htmlBody}
              title="Email preview"
              className="h-[500px] w-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save as Draft"
          )}
        </Button>
      </div>
    </div>
  );
}
