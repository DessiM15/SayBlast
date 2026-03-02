import { mockDb } from "@/test/mocks/db";
import { baseUser, outlookUser } from "@/test/fixtures/users";
import { refreshTokenIfNeeded } from "./token-refresh";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("refreshTokenIfNeeded", () => {
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

  it("returns user unchanged when no expiry is set", async () => {
    const user = { ...baseUser, emailTokenExpiry: null };

    const result = await refreshTokenIfNeeded(user);

    expect(result).toBe(user);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns user unchanged when token is not expired", async () => {
    const user = { ...baseUser, emailTokenExpiry: new Date("2099-01-01") };

    const result = await refreshTokenIfNeeded(user);

    expect(result).toBe(user);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes expired Gmail token", async () => {
    const expiredUser = {
      ...baseUser,
      emailTokenExpiry: new Date(Date.now() - 60_000), // expired 1 minute ago
    };
    const updatedUser = { ...expiredUser, emailAccessToken: "new-token" };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: "new-token", expires_in: 3600 }),
    });
    mockDb.user.update.mockResolvedValue(updatedUser);

    const result = await refreshTokenIfNeeded(expiredUser);

    expect(result.emailAccessToken).toBe("new-token");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("refreshes expired Outlook token", async () => {
    const expiredOutlook = {
      ...outlookUser,
      emailTokenExpiry: new Date(Date.now() - 60_000),
    };
    const updatedUser = { ...expiredOutlook, emailAccessToken: "new-ms-token" };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "new-ms-token",
          refresh_token: "new-refresh",
          expires_in: 3600,
        }),
    });
    mockDb.user.update.mockResolvedValue(updatedUser);

    const result = await refreshTokenIfNeeded(expiredOutlook);

    expect(result.emailAccessToken).toBe("new-ms-token");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws when token refresh fails", async () => {
    const expiredUser = {
      ...baseUser,
      emailTokenExpiry: new Date(Date.now() - 60_000),
    };

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "invalid_grant" }),
    });

    await expect(refreshTokenIfNeeded(expiredUser)).rejects.toThrow(
      "Failed to refresh Gmail token"
    );
  });

  it("throws when no refresh token is available", async () => {
    const noRefreshToken = {
      ...baseUser,
      emailRefreshToken: null,
      emailTokenExpiry: new Date(Date.now() - 60_000),
    };

    await expect(refreshTokenIfNeeded(noRefreshToken)).rejects.toThrow(
      "No refresh token available for Gmail"
    );
  });
});
