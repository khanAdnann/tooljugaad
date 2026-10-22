import { describe, expect, it } from "vitest";
import { detectUnsupportedPlatform } from "../providers/platforms.js";
import { validatePublicHttpsUrl } from "./url.js";

describe("validatePublicHttpsUrl", () => {
  it("rejects non-HTTPS schemes", async () => {
    await expect(validatePublicHttpsUrl(new URL("http://example.com/file.mp4"))).rejects.toThrow("URL_NOT_ALLOWED");
    await expect(validatePublicHttpsUrl(new URL("file:///etc/passwd"))).rejects.toThrow("URL_NOT_ALLOWED");
  });

  describe("detectUnsupportedPlatform", () => {
    it("recognizes supported-domain matching for known platforms", () => {
      expect(detectUnsupportedPlatform("www.youtube.com")?.displayName).toBe("YouTube");
      expect(detectUnsupportedPlatform("youtu.be")?.displayName).toBe("YouTube");
      expect(detectUnsupportedPlatform("m.instagram.com")?.displayName).toBe("Instagram");
    });

    it("does not classify lookalike domains as a platform", () => {
      expect(detectUnsupportedPlatform("youtube.com.attacker.example")).toBeUndefined();
      expect(detectUnsupportedPlatform("example.com")).toBeUndefined();
    });
  });

  it("rejects credentials and non-standard ports", async () => {
    await expect(validatePublicHttpsUrl(new URL("https://user:pass@example.com/file.mp4"))).rejects.toThrow("URL_NOT_ALLOWED");
    await expect(validatePublicHttpsUrl(new URL("https://example.com:8443/file.mp4"))).rejects.toThrow("URL_NOT_ALLOWED");
  });

  it("rejects loopback and private IPv4 addresses", async () => {
    for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.2", "192.168.1.1", "169.254.169.254"]) {
      await expect(validatePublicHttpsUrl(new URL(`https://${address}/media.mp4`))).rejects.toThrow("URL_NOT_ALLOWED");
    }
  });

  it("rejects local hostnames and IPv6 loopback", async () => {
    await expect(validatePublicHttpsUrl(new URL("https://localhost/media.mp4"))).rejects.toThrow("URL_NOT_ALLOWED");
    await expect(validatePublicHttpsUrl(new URL("https://[::1]/media.mp4"))).rejects.toThrow("URL_NOT_ALLOWED");
    await expect(validatePublicHttpsUrl(new URL("https://[fd00::1]/media.mp4"))).rejects.toThrow("URL_NOT_ALLOWED");
  });
});
