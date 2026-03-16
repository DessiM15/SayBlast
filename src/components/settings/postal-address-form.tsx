"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface PostalAddressFormProps {
  initialAddress: string;
}

export default function PostalAddressForm({
  initialAddress,
}: PostalAddressFormProps) {
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;

    setError("");

    const trimmed = address.trim();
    if (!trimmed) {
      setError("Physical mailing address is required for CAN-SPAM compliance");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/settings/postal-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalAddress: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save address");
      }

      toast.success("Mailing address saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="postal-address">Physical mailing address</Label>
        <textarea
          id="postal-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="123 Main St, Suite 100, City, ST 12345"
          rows={3}
          maxLength={500}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Required by CAN-SPAM law. This address appears at the bottom of every
          email you send.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-fit bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save address"
        )}
      </Button>
    </form>
  );
}
