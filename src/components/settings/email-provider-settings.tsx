"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SmtpForm from "@/components/auth/smtp-form";
import { EMAIL_PROVIDERS } from "@/lib/constants";
import type { EmailProvider } from "@/types/auth";

interface EmailSettings {
  emailProvider: string | null;
  emailAddress: string | null;
  emailVerified: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
}

interface EmailProviderSettingsProps {
  initialSettings: EmailSettings;
}

export default function EmailProviderSettings({
  initialSettings,
}: EmailProviderSettingsProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [showPicker, setShowPicker] = useState(!initialSettings.emailProvider);
  const [selectedProvider, setSelectedProvider] =
    useState<EmailProvider | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState("");

  const providerInfo = settings.emailProvider
    ? EMAIL_PROVIDERS[settings.emailProvider as keyof typeof EMAIL_PROVIDERS]
    : null;

  async function handleDisconnect() {
    setIsDisconnecting(true);
    setError("");

    try {
      const response = await fetch("/api/settings/change-email-provider", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Failed to disconnect email provider");
        return;
      }

      setSettings({
        emailProvider: null,
        emailAddress: null,
        emailVerified: false,
        smtpHost: null,
        smtpPort: null,
      });
      setShowPicker(true);
      setConfirmOpen(false);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsDisconnecting(false);
    }
  }

  function handleGmailConnect() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(
        "Gmail OAuth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment."
      );
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/callback/google-email`;
    const scope =
      "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";
    const state = JSON.stringify({ returnTo: "/settings" });
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

    const redirectUri = `${window.location.origin}/api/auth/callback/microsoft-email`;
    const scope =
      "https://outlook.office365.com/Mail.Send offline_access openid email";
    const state = JSON.stringify({ returnTo: "/settings" });
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

  function handleSmtpComplete() {
    router.refresh();
    setShowPicker(false);
    setSelectedProvider(null);
  }

  // State B: Provider picker
  if (showPicker) {
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
          Connect the email account you&apos;ll use to send campaigns.
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

        {settings.emailProvider && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => setShowPicker(false)}
          >
            Cancel
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // State A: Connected — show current provider info
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Provider</p>
        {providerInfo && (
          <Badge variant="secondary">{providerInfo.label}</Badge>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Sender address</p>
        <p className="font-medium">
          {settings.emailAddress ?? "Not connected"}
        </p>
      </div>
      {settings.emailProvider === "smtp" && (
        <div>
          <p className="text-sm text-muted-foreground">SMTP Server</p>
          <p className="font-medium">
            {settings.smtpHost}:{settings.smtpPort}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Status</p>
        <Badge
          variant={settings.emailVerified ? "default" : "destructive"}
          className={
            settings.emailVerified ? "bg-green-100 text-green-800" : ""
          }
        >
          {settings.emailVerified ? "Connected" : "Not verified"}
        </Badge>
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="w-fit"
        onClick={() => setConfirmOpen(true)}
      >
        Change Email Provider
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change email provider?</DialogTitle>
            <DialogDescription>
              This will disconnect your current email provider. You&apos;ll need
              to connect a new one before you can send campaigns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
