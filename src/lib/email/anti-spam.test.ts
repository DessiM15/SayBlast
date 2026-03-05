import { mockDb } from "@/test/mocks/db";
import { checkCooldown } from "./anti-spam";

describe("checkCooldown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows sending when no prior sends exist", async () => {
    mockDb.sendLog.findFirst.mockResolvedValue(null);

    const result = await checkCooldown("new@example.com", "user-1");

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("blocks sending within the 72-hour window", async () => {
    const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    mockDb.sendLog.findFirst.mockResolvedValue({ sentAt: recentDate });

    const result = await checkCooldown("recent@example.com", "user-1");

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("72-hour cooldown active");
  });

  it("blocks at the exact 72-hour boundary", async () => {
    // Exactly at the boundary — findFirst would still match
    const boundaryDate = new Date(Date.now() - 72 * 60 * 60 * 1000 + 1000);
    mockDb.sendLog.findFirst.mockResolvedValue({ sentAt: boundaryDate });

    const result = await checkCooldown("boundary@example.com", "user-1");

    expect(result.allowed).toBe(false);
  });

  it("allows sending after the 72-hour window", async () => {
    // Past the window — findFirst returns null
    mockDb.sendLog.findFirst.mockResolvedValue(null);

    const result = await checkCooldown("old@example.com", "user-1");

    expect(result.allowed).toBe(true);
  });

  it("scopes cooldown to the specific user", async () => {
    // User A sent to this email recently, but User B should not be blocked
    mockDb.sendLog.findFirst.mockResolvedValue(null);

    const result = await checkCooldown("shared@example.com", "user-2");

    expect(result.allowed).toBe(true);
    expect(mockDb.sendLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          campaign: { userId: "user-2" },
        }),
      })
    );
  });

  it("blocks the same user from re-sending within cooldown", async () => {
    const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    mockDb.sendLog.findFirst.mockResolvedValue({ sentAt: recentDate });

    const result = await checkCooldown("shared@example.com", "user-1");

    expect(result.allowed).toBe(false);
    expect(mockDb.sendLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          campaign: { userId: "user-1" },
        }),
      })
    );
  });
});
