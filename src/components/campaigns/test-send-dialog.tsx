"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send } from "lucide-react";

interface TestSendDialogProps {
  campaignId: string;
  defaultEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TestSendDialog({
  campaignId,
  defaultEmail,
  open,
  onOpenChange,
}: TestSendDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/test-send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testEmail: trimmed }),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to send test email");
      }

      toast.success(`Test email sent to ${trimmed}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send test email"
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Email
          </DialogTitle>
          <DialogDescription>
            Send a preview to your inbox. The subject will be prefixed with
            [TEST].
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="test-email">Recipient email</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !email.trim()}
            className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                Send Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
