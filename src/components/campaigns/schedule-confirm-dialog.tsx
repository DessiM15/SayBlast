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
import { CalendarCheck, Clock } from "lucide-react";

interface ScheduleConfirmDialogProps {
  campaign: {
    name: string;
    subjectLine: string;
    scheduledAt: string;
    audienceListName: string | null;
    audienceContactCount: number | null;
    sendingEmail: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ScheduleConfirmDialog({
  campaign,
  open,
  onOpenChange,
  onConfirm,
}: ScheduleConfirmDialogProps) {
  const formattedDate = campaign.scheduledAt
    ? new Date(campaign.scheduledAt).toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Confirm Schedule
          </DialogTitle>
          <DialogDescription>
            This campaign will be sent automatically at the scheduled time.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaign</span>
            <span className="font-medium">{campaign.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subject</span>
            <span className="font-medium">
              {campaign.subjectLine || "(No subject)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audience</span>
            <span className="font-medium">
              {campaign.audienceListName ?? "None selected"}
              {campaign.audienceContactCount !== null &&
                ` (${campaign.audienceContactCount} contacts)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scheduled for</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sending from</span>
            <span className="font-medium">
              {campaign.sendingEmail ?? "Not connected"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
          >
            <CalendarCheck className="mr-1 h-4 w-4" />
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
