import type { EmailProvider } from "@/generated/prisma/enums";
import { baseUser, smtpUser, outlookUser } from "@/test/fixtures/users";
import { createEmailTransport } from "./transport-factory";

// Mock dependencies
vi.mock("@/lib/email/token-refresh", () => ({
  refreshTokenIfNeeded: vi.fn((user: unknown) => Promise.resolve(user)),
}));

vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn().mockReturnValue("decrypted-password"),
}));

vi.mock("nodemailer", () => ({
  createTransport: vi.fn().mockReturnValue({ sendMail: vi.fn() }),
}));

describe("createEmailTransport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-secret");
    vi.stubEnv("MICROSOFT_CLIENT_ID", "ms-id");
    vi.stubEnv("MICROSOFT_CLIENT_SECRET", "ms-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates Gmail transport for gmail provider", async () => {
    const transport = await createEmailTransport(baseUser);

    expect(transport).toBeDefined();
    expect(transport.sendMail).toBeDefined();
  });

  it("creates Outlook transport for outlook provider", async () => {
    const transport = await createEmailTransport(outlookUser);

    expect(transport).toBeDefined();
  });

  it("creates SMTP transport for smtp provider", async () => {
    const transport = await createEmailTransport(smtpUser);

    expect(transport).toBeDefined();
    const { decrypt } = await import("@/lib/encryption");
    expect(decrypt).toHaveBeenCalledWith("encrypted:pass:data");
  });

  it("throws for unknown provider", async () => {
    const unknownUser = { ...baseUser, emailProvider: "yahoo" as EmailProvider };

    await expect(createEmailTransport(unknownUser)).rejects.toThrow(
      "Unknown email provider: yahoo"
    );
  });

  it("throws for incomplete SMTP config", async () => {
    const incompleteSmtp = { ...smtpUser, smtpHost: null };

    await expect(createEmailTransport(incompleteSmtp)).rejects.toThrow(
      "Incomplete SMTP configuration"
    );
  });
});
