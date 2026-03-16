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
  emailProvider: "gmail" as const,
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

  it("rejects emails without a valid domain", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "email,firstName\nuser@,Alice\n@@@,Bob\nuser@.com,Carol\ngood@example.com,Dave";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.added).toBe(1); // only good@example.com
    expect(json.invalid).toBe(3);
    expect(json.invalidRows).toEqual([2, 3, 4]);
  });

  it("accepts plus-addressed emails", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "email\nuser+tag@gmail.com";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.added).toBe(1);
    expect(json.invalid).toBe(0);
  });

  it("rejects emails with spaces", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });

    const csv = "email\nuser @example.com";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.invalid).toBe(1);
  });

  it("strips CSV injection characters from name fields", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "email,firstName,lastName\nalice@example.com,=SUM(A1),+cmd";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.added).toBe(1);
    const createCall = mockDb.contact.create.mock.calls[0][0];
    expect(createCall.data.firstName).toBe("SUM(A1)");
    expect(createCall.data.lastName).toBe("cmd");
  });

  it("does not strip CSV injection characters from email field", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "email\n+tag@example.com";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.added).toBe(1);
    const createCall = mockDb.contact.create.mock.calls[0][0];
    expect(createCall.data.email).toBe("+tag@example.com");
  });

  it("returns invalid row numbers in response", async () => {
    mockDb.audienceList.findFirst.mockResolvedValue({ id: "list-1", userId: "user-1" });
    mockDb.contact.create.mockResolvedValue({});

    const csv = "email\ngood@test.com\nbad-email\ngood2@test.com\nalso-bad";
    const res = await POST(makeRequest({ audienceListId: "list-1", csvText: csv }) as never);
    const json = await res.json();

    expect(json.added).toBe(2);
    expect(json.invalid).toBe(2);
    expect(json.invalidRows).toEqual([3, 5]);
  });
});
