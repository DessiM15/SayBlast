import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Mail, Shield } from "lucide-react";
import ChangePasswordForm from "@/components/settings/change-password-form";
import EmailProviderSettings from "@/components/settings/email-provider-settings";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      emailProvider: true,
      emailAddress: true,
      emailVerified: true,
      smtpHost: true,
      smtpPort: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and email connection
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Login email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Email Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Connection
            </CardTitle>
            <CardDescription>
              The email account used to send campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailProviderSettings
              initialSettings={{
                emailProvider: user.emailProvider,
                emailAddress: user.emailAddress,
                emailVerified: user.emailVerified,
                smtpHost: user.smtpHost,
                smtpPort: user.smtpPort,
              }}
            />
          </CardContent>
        </Card>
      </div>

      {user.passwordHash && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
