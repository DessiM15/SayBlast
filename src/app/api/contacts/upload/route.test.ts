import { mockDb } from "@/test/mocks/db";

// Mock requireSession via the auth/session module
vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(),
}));

import { requireSession } from "@/lib/auth/session";
import { POST } from "./route";

const mockSession = {
  id: "user-1",
  email: "test@example.com",
  name: "Test",
  image: null,
  onboardingComplete: true,
  emailProvider: "gmail",
  emailAddress: "test@example.com",
  emailVerified: true,
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/contacts/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contacts/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSession).mockResolvedValue(mockSession);
  });

  it("parses valid CSV and creates contacts", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "email,firstName,lastName\nalice@example.com,Alice,Smith\nbob@example.com,Bob,Jones";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.added).toBe(2);
    expect(json.invalid).toBe(0);
  });

  it("handles case-insensitive headers", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "Email,First Name,Last Name\ntest@example.com,Test,User";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.added).toBe(1);
  });

  it("counts rows with missing email as invalid", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });

    const csv = "email,firstName\n,Alice\nbob@example.com,Bob";
    mockDb.contact.create.mockResolvedValue({});
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.invalid).toBe(1);
    expect(json.added).toBe(1);
  });

  it("counts duplicate emails as skipped", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Unique constraint"));

    const csv = "email\nalice@example.com\nalice@example.com";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.added).toBe(1);
    expect(json.skipped).toBe(1);
  });

  it("returns 400 for empty CSV", async () => {
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireSession).mockRejectedValue(new Error("Unauthorized"));

    const res = await POST(
      makeRequest({ audienceListId: "list-1", csvText: "email\na@b.com" }) as never
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when audience list not found", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue(null);

    const csv = "email\ntest@example.com";
    const res = await POST(makeRequest({ audienceListId: "fake-id", csvText: csv }) as never);

    expect(res.status).toBe(404);
  });
});
