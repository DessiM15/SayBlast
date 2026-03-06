import { mockDb } from "@/test/mocks/db";
import { mockGetUser } from "@/test/mocks/supabase";
import { getSession, requireSession } from "./session";

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the DB user when supabase and DB user both exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
    });

    const dbUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      image: null,
      onboardingComplete: true,
      emailProvider: "gmail" as const,
      emailAddress: "test@example.com",
      emailVerified: true,
    };
    mockDb.user.findUnique.mockResolvedValue(dbUser);

    const result = await getSession();

    expect(result).toEqual(dbUser);
  });

  it("returns null when supabase has no user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const result = await getSession();

    expect(result).toBeNull();
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when DB user is not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "ghost@example.com" } },
    });
    mockDb.user.findUnique.mockResolvedValue(null);

    const result = await getSession();

    expect(result).toBeNull();
  });
});

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session when user exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
    });
    const dbUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      image: null,
      onboardingComplete: true,
      emailProvider: "gmail" as const,
      emailAddress: "test@example.com",
      emailVerified: true,
    };
    mockDb.user.findUnique.mockResolvedValue(dbUser);

    const result = await requireSession();

    expect(result).toEqual(dbUser);
  });

  it("throws Unauthorized when no session exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(requireSession()).rejects.toThrow("Unauthorized");
  });
});
