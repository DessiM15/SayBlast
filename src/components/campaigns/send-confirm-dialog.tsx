"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Send } from "lucide-react";

interface SendConfirmDialogProps {
  campaign: {
    name: string;
    subjectLine: string | null;
    audienceList: { name: string } | null;
    totalRecipients: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSending: boolean;
  onConfirm: () => void;
}

export default function SendConfirmDialog({
  campaign,
  open,
  onOpenChange,
  isSending,
  onConfirm,
}: SendConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirm Send
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Emails will be sent immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaign</span>
            <span className="font-medium">{campaign.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subject</span>
            <span className="font-medium">{campaign.subjectLine}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audience</span>
            <span className="font-medium">
              {campaign.audienceList?.name ?? "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipients</span>
            <span className="font-medium">{campaign.totalRecipients}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending}
            className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
          >
            <Send className="mr-1 h-4 w-4" />
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
