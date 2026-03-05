import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import ConfirmEmailForm from "./confirm-email-form";

interface PendingEmailData {
  provider: string;
  emailAddress: string;
  returnTo: string;
  createdAt: number;
}

const MAX_PENDING_AGE_MS = 10 * 60 * 1000; // 10 minutes

const PROVIDER_LABELS: Record<string, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
};

export default async function ConfirmEmailConnectionPage() {
  const session = await requireSession();

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { pendingEmailData: true },
  });

  if (!user?.pendingEmailData) {
    redirect("/dashboard");
  }

  let pending: PendingEmailData;
  try {
    const raw = decrypt(user.pendingEmailData);
    pending = JSON.parse(raw) as PendingEmailData;
  } catch {
    // Corrupted data — clear it and redirect
    await db.user.update({
      where: { id: session.id },
      data: { pendingEmailData: null },
    });
    redirect("/dashboard");
  }

  // Expired — clear and redirect
  if (Date.now() - pending.createdAt > MAX_PENDING_AGE_MS) {
    await db.user.update({
      where: { id: session.id },
      data: { pendingEmailData: null },
    });
    const returnTo = pending.returnTo || "/dashboard";
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=email_connection_expired`);
  }

  const providerLabel = PROVIDER_LABELS[pending.provider] ?? pending.provider;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#F6D365]/10 to-[#FDA085]/10 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Confirm email connection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect this email account to your SayBlast account? This email will
          be used to send your campaigns.
        </p>

        <div className="mt-6 rounded-md border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Email address</p>
          <p className="mt-1 font-medium">{pending.emailAddress}</p>
          <p className="mt-3 text-sm text-muted-foreground">Provider</p>
          <p className="mt-1 font-medium">{providerLabel}</p>
        </div>

        <ConfirmEmailForm returnTo={pending.returnTo} />
      </div>
    </div>
  );
}
