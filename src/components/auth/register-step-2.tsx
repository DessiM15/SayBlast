"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SmtpForm from "@/components/auth/smtp-form";
import type { EmailProvider } from "@/types/auth";

interface RegisterStep2Props {
  userId: string;
  onComplete: () => void;
}

export default function RegisterStep2({
  userId,
  onComplete,
}: RegisterStep2Props) {
  const [selectedProvider, setSelectedProvider] =
    useState<EmailProvider | null>(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleGmailConnect() {
    // TODO: Implement Gmail OAuth flow when Google credentials are ready
    // This would redirect to Google OAuth consent screen requesting gmail.send scope
    // After callback, tokens are stored on the user record
    setError(
      "Gmail OAuth requires Google Cloud Console credentials. Please use SMTP for now, or configure Google OAuth credentials in your environment."
    );
  }

  async function handleOutlookConnect() {
    // TODO: Implement Outlook OAuth flow when Azure credentials are ready
    // This would redirect to Microsoft OAuth consent screen requesting Mail.Send scope
    // After callback, tokens are stored on the user record
    setError(
      "Outlook OAuth requires Azure Portal credentials. Please use SMTP for now, or configure Microsoft OAuth credentials in your environment."
    );
  }

  async function handleSmtpComplete() {
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to complete onboarding");
        return;
      }

      onComplete();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  if (selectedProvider === "smtp") {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setSelectedProvider(null)}
        >
          &larr; Back to options
        </Button>
        <SmtpForm userId={userId} onComplete={handleSmtpComplete} />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Connect the email account you&apos;ll use to send campaigns. This is
        required to complete setup.
      </p>

      <Button
        variant="outline"
        className="flex h-auto w-full flex-col items-start gap-1 p-4"
        onClick={handleGmailConnect}
      >
        <span className="font-medium">Connect Gmail</span>
        <span className="text-xs text-muted-foreground">
          Send via your Gmail account using OAuth
        </span>
      </Button>

      <Button
        variant="outline"
        className="flex h-auto w-full flex-col items-start gap-1 p-4"
        onClick={handleOutlookConnect}
      >
        <span className="font-medium">Connect Outlook</span>
        <span className="text-xs text-muted-foreground">
          Send via your Outlook account using OAuth
        </span>
      </Button>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="outline"
        className="flex h-auto w-full flex-col items-start gap-1 p-4"
        onClick={() => setSelectedProvider("smtp")}
      >
        <span className="font-medium">Connect via SMTP</span>
        <span className="text-xs text-muted-foreground">
          Use any email provider with SMTP credentials
        </span>
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground">
          Completing setup...
        </p>
      )}
    </div>
  );
}
