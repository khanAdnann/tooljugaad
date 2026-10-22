import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./config";

describe("resolveApiUrl", () => {
  it("keeps relative API paths for the local Vite proxy", () => {
    expect(resolveApiUrl("/api/v1/media/jobs/abc/file")).toBe("/api/v1/media/jobs/abc/file");
  });

  it("resolves temporary download paths against the configured backend origin", () => {
    expect(resolveApiUrl("/api/v1/media/jobs/abc/file?token=secret", "https://api.example.test"))
      .toBe("https://api.example.test/api/v1/media/jobs/abc/file?token=secret");
  });

  it("rejects a download link that escapes the configured API origin", () => {
    expect(() => resolveApiUrl("https://attacker.example/file", "https://api.example.test"))
      .toThrow("outside the configured API origin");
  });
});
