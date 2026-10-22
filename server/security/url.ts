import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPublicIp(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  const family = isIP(normalized);
  if (family === 4) {
    const octets = normalized.split(".").map(Number);
    const [a, b] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 88 && octets[2] === 99) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && octets[2] === 100) ||
      (a === 203 && b === 0 && octets[2] === 113) ||
      a >= 224
    );
  }
  if (family === 6) {
    if (normalized.startsWith("::ffff:")) {
      return isPublicIp(normalized.slice(7));
    }
    return (
      /^[23]/.test(normalized) &&
      !normalized.startsWith("2001:db8:") &&
      !normalized.startsWith("2001:10:")
    );
  }
  return false;
}

export async function validatePublicHttpsUrl(input: URL): Promise<{
  url: URL;
  address: string;
  family: 4 | 6;
}> {
  if (input.protocol !== "https:" || input.username || input.password) {
    throw new Error("URL_NOT_ALLOWED");
  }
  if (input.port && input.port !== "443") {
    throw new Error("URL_NOT_ALLOWED");
  }

  const hostname = input.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("URL_NOT_ALLOWED");
  }

  let addresses: Array<{ address: string; family: number }>;
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) }];
  } else {
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error("HOST_UNAVAILABLE");
    }
  }

  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("URL_NOT_ALLOWED");
  }

  const clean = new URL(input);
  clean.hash = "";
  const selected = addresses.find(({ address }) => isPublicIp(address));
  if (!selected || (selected.family !== 4 && selected.family !== 6)) {
    throw new Error("URL_NOT_ALLOWED");
  }
  return { url: clean, address: selected.address, family: selected.family };
}
