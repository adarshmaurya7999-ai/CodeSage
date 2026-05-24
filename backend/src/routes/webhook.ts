import { Router, type Request, type Response } from "express";
import { analyzePR } from "../analysis/orchestrator";
import { verifyGitHubWebhookSignature } from "../github/verifyWebhook";

const router = Router();

const HANDLED_ACTIONS = new Set(["opened", "synchronize"]);

function getWebhookSecret(): string {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret?.trim()) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not configured");
  }
  return secret.trim();
}

interface PullRequestPayload {
  action: string;
  installation?: { id: number };
  repository: { name: string; owner: { login: string } };
  pull_request: {
    number: number;
    title: string;
    head: { sha: string };
    user?: { login: string };
  };
}

/**
 * GitHub webhook — verify signature, return 200, run analyzePR in background.
 */
router.post(
  "/github",
  async (req: Request, res: Response): Promise<void> => {
    const deliveryId = req.headers["x-github-delivery"]?.toString() ?? "unknown";
    const eventName = req.headers["x-github-event"]?.toString() ?? "";
    const signature = req.headers["x-hub-signature-256"]?.toString() ?? "";

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf-8")
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

    let secret: string;
    try {
      secret = getWebhookSecret();
    } catch (error) {
      console.error("[webhook] Config error:", error);
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    const isValid = verifyGitHubWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    if (eventName !== "pull_request") {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    let payload: PullRequestPayload;
    try {
      payload = JSON.parse(rawBody) as PullRequestPayload;
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    if (!HANDLED_ACTIONS.has(payload.action)) {
      res.status(200).json({ ok: true, skipped: true, action: payload.action });
      return;
    }

    const installationId = payload.installation?.id;
    if (!installationId) {
      res.status(422).json({ error: "Missing installation.id" });
      return;
    }

    const pr = payload.pull_request;

    res.status(200).json({
      ok: true,
      deliveryId,
      queued: { owner: payload.repository.owner.login, repo: payload.repository.name },
    });

    void analyzePR({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      prNumber: pr.number,
      prTitle: pr.title,
      author: pr.user?.login ?? "unknown",
      commitSha: pr.head.sha,
      installationId,
    }).catch((error) => {
      console.error(`[webhook] analyzePR failed (${deliveryId}):`, error);
    });
  },
);

export default router;
