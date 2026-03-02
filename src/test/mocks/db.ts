import { vi } from "vitest";

export const mockDb = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  campaign: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  contact: {
    create: vi.fn(),
    update: vi.fn(),
  },
  audienceList: {
    findFirst: vi.fn(),
  },
  sendLog: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));
