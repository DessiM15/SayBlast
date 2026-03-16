import { processUnsubscribe } from "@/lib/email/unsubscribe";

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;

  let status: "success" | "invalid" | "missing" = "missing";

  if (token) {
    const result = await processUnsubscribe(token);
    status = result.success ? "success" : "invalid";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #F6D365, #FDA085)",
          }}
        >
          {status === "success" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        {status === "success" && (
          <>
            <h1 className="mb-2 text-2xl font-bold">Unsubscribed</h1>
            <p className="text-muted-foreground">
              You have been successfully unsubscribed. You will no longer receive
              emails from this sender.
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className="mb-2 text-2xl font-bold">Invalid Link</h1>
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has already been used.
            </p>
          </>
        )}

        {status === "missing" && (
          <>
            <h1 className="mb-2 text-2xl font-bold">Invalid Link</h1>
            <p className="text-muted-foreground">
              No unsubscribe token was provided. Please use the link from your
              email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
