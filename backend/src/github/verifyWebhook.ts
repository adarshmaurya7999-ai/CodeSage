import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies GitHub webhook `x-hub-signature-256` (HMAC SHA-256).
 * Avoids @octokit/webhooks, which breaks under tsx on some Node versions.
 */
export function verifyGitHubWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const body = typeof payload === "string" ? payload : payload.toString("utf-8");
  const expected =
    "sha256=" + createHmac("sha256", secret).update(body, "utf-8").digest("hex");

  const expectedBuf = Buffer.from(expected, "utf-8");
  const actualBuf = Buffer.from(signatureHeader, "utf-8");

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, actualBuf);
}
