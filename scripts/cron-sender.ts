import cron from "node-cron";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("CRON_SECRET environment variable is required");
  process.exit(1);
}

console.log(`[cron-sender] Starting local cron sender`);
console.log(`[cron-sender] Target: ${APP_URL}/api/cron/send`);
console.log(`[cron-sender] Schedule: every minute`);

// Run every minute
cron.schedule("* * * * *", async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Checking for scheduled campaigns...`);

  try {
    const response = await fetch(`${APP_URL}/api/cron/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      console.error(`[${timestamp}] Error (${response.status}):`, data);
      return;
    }

    console.log(`[${timestamp}] Result:`, JSON.stringify(data, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${timestamp}] Failed to reach API:`, message);
  }
});
