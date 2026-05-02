import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./relativeTime";

const NOW = new Date("2026-05-02T12:00:00Z");

describe("formatRelativeTime", () => {
  it("returns 'just now' for events under a minute old", () => {
    expect(formatRelativeTime("2026-05-02T11:59:30Z", NOW)).toBe("just now");
  });

  it("returns minutes for events under an hour old", () => {
    expect(formatRelativeTime("2026-05-02T11:45:00Z", NOW)).toBe("15m ago");
  });

  it("returns hours for events under a day old", () => {
    expect(formatRelativeTime("2026-05-02T09:00:00Z", NOW)).toBe("3h ago");
  });

  it("returns days for events under a week old", () => {
    expect(formatRelativeTime("2026-04-29T12:00:00Z", NOW)).toBe("3d ago");
  });

  it("returns weeks for events under a month old", () => {
    expect(formatRelativeTime("2026-04-18T12:00:00Z", NOW)).toBe("2w ago");
  });

  it("returns months for events under a year old", () => {
    expect(formatRelativeTime("2026-01-15T12:00:00Z", NOW)).toBe("3mo ago");
  });

  it("returns years for older events", () => {
    expect(formatRelativeTime("2024-05-02T12:00:00Z", NOW)).toBe("2y ago");
  });

  it("accepts Date objects directly", () => {
    expect(formatRelativeTime(new Date("2026-05-02T11:45:00Z"), NOW)).toBe("15m ago");
  });
});
