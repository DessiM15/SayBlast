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
import { Badge } from "@/components/ui/badge";
import { EMAIL_PROVIDERS } from "@/lib/constants";
import { Mail, Shield } from "lucide-react";

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
    },
  });

  if (!user) redirect("/login");

  const providerInfo = user.emailProvider
    ? EMAIL_PROVIDERS[user.emailProvider as keyof typeof EMAIL_PROVIDERS]
    : null;

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
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Provider</p>
              {providerInfo && (
                <Badge variant="secondary">{providerInfo.label}</Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sender address</p>
              <p className="font-medium">
                {user.emailAddress ?? "Not connected"}
              </p>
            </div>
            {user.emailProvider === "smtp" && (
              <div>
                <p className="text-sm text-muted-foreground">SMTP Server</p>
                <p className="font-medium">
                  {user.smtpHost}:{user.smtpPort}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={user.emailVerified ? "default" : "destructive"}
                className={
                  user.emailVerified
                    ? "bg-green-100 text-green-800"
                    : ""
                }
              >
                {user.emailVerified ? "Connected" : "Not verified"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
