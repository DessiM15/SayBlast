import { processTranscript } from "./process-transcript";

const validResponse = {
  campaignName: "Spring Sale",
  subjectLines: ["Spring deals!", "Don't miss out", "Sale starts now"],
  htmlBody: "<p>Sale</p>",
  textBody: "Sale",
  targetAudience: "Customers",
  tone: "friendly",
  cta: "Shop now",
  keyPoints: ["50% off", "Free shipping"],
};

// Use vi.hoisted for mock references used inside vi.mock factory
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

describe("processTranscript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses valid JSON response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(validResponse) }],
    });

    const result = await processTranscript("Send a spring sale email");

    expect(result.campaignName).toBe("Spring Sale");
    expect(result.subjectLines).toHaveLength(3);
  });

  it("extracts JSON from markdown-wrapped response", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "```json\n" + JSON.stringify(validResponse) + "\n```",
        },
      ],
    });

    const result = await processTranscript("Send a sale email");

    expect(result.campaignName).toBe("Spring Sale");
  });

  it("throws on completely invalid response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "I cannot help with that." }],
    });

    await expect(processTranscript("bad input")).rejects.toThrow(
      "Failed to parse AI response as JSON"
    );
  });

  it("throws when required key is missing", async () => {
    const incomplete = { ...validResponse };
    delete (incomplete as Record<string, unknown>).campaignName;

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(incomplete) }],
    });

    await expect(processTranscript("test")).rejects.toThrow();
  });

  it("throws when API returns no text block", async () => {
    mockCreate.mockResolvedValue({
      content: [],
    });

    await expect(processTranscript("test")).rejects.toThrow(
      "No text response from Claude API"
    );
  });
});
