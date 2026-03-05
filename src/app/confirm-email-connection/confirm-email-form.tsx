"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ConfirmEmailFormProps {
  returnTo: string;
}

export default function ConfirmEmailForm({ returnTo }: ConfirmEmailFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const destination = returnTo || "/dashboard";

  async function handleConfirm() {
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/confirm-email-connection", {
        method: "POST",
      });

      const data = (await response.json()) as {
        success?: boolean;
        returnTo?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Failed to confirm connection");
        return;
      }

      router.push(data.returnTo ?? destination);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  function handleCancel() {
    router.push(destination);
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
      >
        {isPending ? "Connecting..." : "Confirm Connection"}
      </Button>

      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isPending}
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}
