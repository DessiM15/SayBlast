import type { User } from "@/generated/prisma/client";

export const baseUser: User = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  passwordHash: null,
  image: null,
  emailProvider: "gmail",
  emailAddress: "test@example.com",
  emailAccessToken: "access-token-123",
  emailRefreshToken: "refresh-token-456",
  emailTokenExpiry: new Date("2099-01-01"),
  smtpHost: null,
  smtpPort: null,
  smtpUser: null,
  smtpPass: null,
  smtpSecure: true,
  emailVerified: true,
  onboardingComplete: true,
  pendingEmailData: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const smtpUser: User = {
  ...baseUser,
  id: "user-smtp",
  emailProvider: "smtp",
  smtpHost: "smtp.example.com",
  smtpPort: 587,
  smtpUser: "smtp-user",
  smtpPass: "encrypted:pass:data",
  smtpSecure: false,
};

export const outlookUser: User = {
  ...baseUser,
  id: "user-outlook",
  emailProvider: "outlook",
};
