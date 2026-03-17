"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RegisterStepPostalProps {
  onComplete: () => void;
}

export default function RegisterStepPostal({ onComplete }: RegisterStepPostalProps) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;

    const trimmed = address.trim();
    if (!trimmed) {
      setError("Mailing address is required");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      // Save postal address
      const saveResponse = await fetch("/api/settings/postal-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalAddress: trimmed }),
      });

      if (!saveResponse.ok) {
        const data = (await saveResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to save address");
      }

      // Complete onboarding
      const completeResponse = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
      });

      if (!completeResponse.ok) {
        const data = (await completeResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to complete setup");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        U.S. CAN-SPAM law requires a physical mailing address on every
        marketing email. This appears in a small footer at the bottom of your
        campaigns.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="postal-address">Mailing address</Label>
        <textarea
          id="postal-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="123 Main St, Suite 100, City, ST 12345"
          rows={3}
          maxLength={500}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          This can be a street address, PO Box, or registered agent address.
          You can change it later in Settings.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || !address.trim()}
        className="w-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Completing setup...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}
