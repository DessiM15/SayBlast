import { mockDb } from "@/test/mocks/db";
import { baseUser } from "@/test/fixtures/users";
import { sendCampaign } from "./campaign-sender";
import { CampaignStatus } from "@/generated/prisma/client";

// Use vi.hoisted to avoid hoisting issues with vi.mock factories
const { mockSendMail, mockCheckCooldown } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockCheckCooldown: vi.fn(),
}));

vi.mock("@/lib/email/transport-factory", () => ({
  createEmailTransport: vi.fn().mockResolvedValue({
    sendMail: mockSendMail,
  }),
}));

vi.mock("@/lib/email/anti-spam", () => ({
  checkCooldown: (...args: unknown[]) => mockCheckCooldown(...args),
}));

function makeCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: "campaign-1",
    userId: baseUser.id,
    status: CampaignStatus.sending,
    htmlBody: "<p>Hello</p>",
    textBody: "Hello",
    subjectLine: "Test Subject",
    user: { ...baseUser },
    audienceList: {
      contacts: [
        { id: "c1", email: "alice@example.com" },
        { id: "c2", email: "bob@example.com" },
      ],
    },
    ...overrides,
  };
}

describe("sendCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCheckCooldown.mockResolvedValue({ allowed: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error when campaign not found", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(null);

    const result = await sendCampaign("nonexistent");

    expect(result.errors).toContain("Campaign not found");
    expect(result.sent).toBe(0);
  });

  it("returns error when campaign is not in sending status", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign({ status: CampaignStatus.draft }));

    const result = await sendCampaign("campaign-1");

    expect(result.errors[0]).toContain('not in "sending" status');
  });

  it("fails campaign when no HTML body", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign({ htmlBody: null }));
    mockDb.campaign.update.mockResolvedValue({});

    const result = await sendCampaign("campaign-1");

    expect(result.errors).toContain("Campaign has no HTML body");
    expect(mockDb.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: CampaignStatus.failed } })
    );
  });

  it("fails campaign when no contacts", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(
      makeCampaign({ audienceList: { contacts: [] } })
    );
    mockDb.campaign.update.mockResolvedValue({});

    const result = await sendCampaign("campaign-1");

    expect(result.errors[0]).toContain("no audience");
  });

  it("sends to all contacts successfully", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign());
    mockSendMail.mockResolvedValue({});
    mockDb.sendLog.create.mockResolvedValue({});
    mockDb.contact.update.mockResolvedValue({});
    mockDb.campaign.update.mockResolvedValue({});

    const resultPromise = sendCampaign("campaign-1");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await resultPromise;

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it("skips contacts on cooldown", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign());
    mockCheckCooldown
      .mockResolvedValueOnce({ allowed: false, reason: "cooldown" })
      .mockResolvedValueOnce({ allowed: true });
    mockSendMail.mockResolvedValue({});
    mockDb.sendLog.create.mockResolvedValue({});
    mockDb.contact.update.mockResolvedValue({});
    mockDb.campaign.update.mockResolvedValue({});

    const resultPromise = sendCampaign("campaign-1");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await resultPromise;

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(1);
  });

  it("logs failed sends and continues", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign());
    mockSendMail
      .mockRejectedValueOnce(new Error("SMTP error"))
      .mockResolvedValueOnce({});
    mockDb.sendLog.create.mockResolvedValue({});
    mockDb.contact.update.mockResolvedValue({});
    mockDb.campaign.update.mockResolvedValue({});

    const resultPromise = sendCampaign("campaign-1");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await resultPromise;

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.errors[0]).toContain("alice@example.com: SMTP error");
  });

  it("sets final status to failed when all sends fail", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign());
    mockSendMail.mockRejectedValue(new Error("Down"));
    mockDb.sendLog.create.mockResolvedValue({});
    mockDb.campaign.update.mockResolvedValue({});

    const resultPromise = sendCampaign("campaign-1");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await resultPromise;

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(2);
    const lastUpdateCall = mockDb.campaign.update.mock.calls.at(-1);
    expect(lastUpdateCall?.[0].data.status).toBe(CampaignStatus.failed);
  });

  it("fails campaign when transport creation throws", async () => {
    mockDb.campaign.findUnique.mockResolvedValue(makeCampaign());
    mockDb.campaign.update.mockResolvedValue({});

    const { createEmailTransport } = await import("@/lib/email/transport-factory");
    vi.mocked(createEmailTransport).mockRejectedValueOnce(new Error("No credentials"));

    const result = await sendCampaign("campaign-1");

    expect(result.errors).toContain("No credentials");
    expect(mockDb.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: CampaignStatus.failed } })
    );
  });
});
