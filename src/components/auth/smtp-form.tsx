"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SmtpFormProps {
  onComplete: () => void;
}

export default function SmtpForm({ onComplete }: SmtpFormProps) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(false);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >("idle");
  const [isSaving, setIsSaving] = useState(false);

  async function handleTest() {
    setTestStatus("testing");
    setError("");

    try {
      const response = await fetch("/api/auth/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: parseInt(port, 10),
          username,
          password,
          secure,
        }),
      });

      if (response.ok) {
        setTestStatus("success");
      } else {
        const data = await response.json();
        setError(data.error || "Connection test failed");
        setTestStatus("failed");
      }
    } catch {
      setError("Failed to test connection");
      setTestStatus("failed");
    }
  }

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/auth/connect-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: parseInt(port, 10),
          username,
          password,
          secure,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save SMTP settings");
        return;
      }

      onComplete();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = host && port && username && password;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="smtp-host">SMTP Host</Label>
        <Input
          id="smtp-host"
          placeholder="smtp.example.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="smtp-port">Port</Label>
        <Input
          id="smtp-port"
          type="number"
          placeholder="587"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="smtp-username">Username</Label>
        <Input
          id="smtp-username"
          placeholder="you@example.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="smtp-password">Password</Label>
        <Input
          id="smtp-password"
          type="password"
          placeholder="App password or SMTP password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="smtp-secure"
          type="checkbox"
          checked={secure}
          onChange={(e) => setSecure(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="smtp-secure" className="text-sm font-normal">
          Use SSL/TLS (port 465)
        </Label>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {testStatus === "success" && (
        <p className="text-sm text-green-600">
          Connection successful! You can save your settings.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleTest}
          disabled={!canSave || testStatus === "testing"}
        >
          {testStatus === "testing" ? "Testing..." : "Test Connection"}
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
          onClick={handleSave}
          disabled={!canSave || isSaving}
        >
          {isSaving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
