"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RegisterStep3() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#F6D365] to-[#FDA085]">
        <svg
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Setup complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your email account is connected and you&apos;re ready to start
          creating voice-powered campaigns.
        </p>
      </div>
      <Button
        className="w-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
        onClick={() => {
          router.push("/dashboard");
          router.refresh();
        }}
      >
        Go to Dashboard
      </Button>
    </div>
  );
}
