"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface RegisterStep1Props {
  onComplete: (userId: string) => void;
}

export default function RegisterStep1({ onComplete }: RegisterStep1Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;

    setErrors({});
    setServerError("");

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (password.length > 72) newErrors.password = "Password must be 72 characters or fewer";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsPending(true);

    try {
      // Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (signUpError) {
        setServerError(signUpError.message);
        return;
      }

      // Create user in our database
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Registration failed");
        return;
      }

      onComplete(data.userId);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleOAuthSignup(provider: "google" | "azure") {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setServerError(authError.message);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            disabled={isPending}
          />
          {errors.name && (
            <p className="text-sm text-destructive" role="alert">{errors.name}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-sm text-destructive" role="alert">{errors.email}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="8–72 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            disabled={isPending}
          />
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">{errors.password}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={isPending}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive" role="alert">{errors.confirmPassword}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
        >
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthSignup("google")}
        >
          Sign up with Google
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthSignup("azure")}
        >
          Sign up with Microsoft
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
