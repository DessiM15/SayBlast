"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SmtpForm from "@/components/auth/smtp-form";
import { EmailProvider } from "@/generated/prisma/enums";

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

  function handleGmailConnect() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(
        "Gmail OAuth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment."
      );
      return;
    }

    const nonce = crypto.randomUUID();
    document.cookie = `oauth_nonce=${nonce}; path=/; max-age=600; SameSite=Lax; Secure`;

    const redirectUri = `${window.location.origin}/api/auth/callback/google-email`;
    const scope = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";
    const state = JSON.stringify({ returnTo: "/dashboard", nonce });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  function handleOutlookConnect() {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    if (!clientId) {
      setError(
        "Outlook OAuth is not configured. Set NEXT_PUBLIC_MICROSOFT_CLIENT_ID in your environment."
      );
      return;
    }

    const nonce = crypto.randomUUID();
    document.cookie = `oauth_nonce=${nonce}; path=/; max-age=600; SameSite=Lax; Secure`;

    const redirectUri = `${window.location.origin}/api/auth/callback/microsoft-email`;
    const scope = "https://outlook.office365.com/Mail.Send offline_access openid email";
    const state = JSON.stringify({ returnTo: "/dashboard", nonce });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      prompt: "consent",
      state,
    });

    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async function handleSmtpComplete() {
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
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

  if (selectedProvider === EmailProvider.smtp) {
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
        <SmtpForm onComplete={handleSmtpComplete} />
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
        onClick={() => setSelectedProvider(EmailProvider.smtp)}
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
