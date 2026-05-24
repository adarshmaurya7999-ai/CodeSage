export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line?: number;
}

export interface DiffLine {
  oldNum: number | null;
  newNum: number | null;
  content: string;
  type: "context" | "add" | "remove" | "flagged";
  commentCount?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export const prData = {
  number: 243,
  title: "Add payment retry logic",
  status: "open" as const,
  dangerScore: 78,
  riskLabel: "High Risk",
  author: "sarah.chen",
  created: "May 21, 2026",
  repository: "acme/payments-api",
  branch: "feat/payment-retry → main",
  labels: [
    { name: "backend", variant: "violet" as const },
    { name: "payments", variant: "blue" as const },
    { name: "enhancement", variant: "slate" as const },
  ],
  diffStats: { additions: 45, deletions: 12 },
  filePath: "src/services/payment-retry.ts",
};

export const sidebarStats = [
  { label: "Reviewed PRs", value: 1284, delta: "+12%" },
  { label: "Avg. Danger Score", value: 34, delta: "+8%" },
  { label: "Issues Found", value: 3421, delta: "+15%" },
  { label: "Time Saved", value: "847h", delta: "+22%" },
];

export const navItems = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "pull-requests", label: "Pull Requests", icon: "git-pull", active: true },
  { id: "findings", label: "Findings", icon: "alert" },
  { id: "convos", label: "Conversation", icon: "message" },
];

export const changedFiles = [
  {
    path: "src/services/payment-retry.ts",
    additions: 45,
    deletions: 12,
    checked: true,
  },
  {
    path: "src/utils/backoff.ts",
    additions: 18,
    deletions: 3,
    checked: true,
  },
  {
    path: "tests/payment-retry.test.ts",
    additions: 62,
    deletions: 0,
    checked: false,
  },
];

export const commitHistory = [
  {
    sha: "a3f9c21",
    message: "Add exponential backoff for retries",
    author: "sarah.chen",
    time: "2 hours ago",
  },
  {
    sha: "b812e04",
    message: "Wire payment gateway charge call",
    author: "sarah.chen",
    time: "5 hours ago",
  },
  {
    sha: "c104d88",
    message: "Initial payment retry scaffold",
    author: "sarah.chen",
    time: "Yesterday",
  },
];

export const findings: Finding[] = [
  {
    id: "1",
    severity: "high",
    title: "Missing idempotency key on retry",
    description:
      "Payment retries without idempotency keys may cause duplicate charges when the gateway times out.",
    file: "src/services/payment-retry.ts",
    line: 92,
  },
  {
    id: "2",
    severity: "medium",
    title: "Exponential backoff not capped",
    description:
      "Retry delay grows unbounded; consider max delay of 30s to avoid queue starvation.",
    file: "src/services/payment-retry.ts",
    line: 78,
  },
  {
    id: "3",
    severity: "low",
    title: "Log level too verbose in hot path",
    description: "info-level logs on every retry attempt may inflate observability costs.",
    file: "src/services/payment-retry.ts",
    line: 64,
  },
];

export const diffLines: DiffLine[] = [
  { oldNum: 85, newNum: 85, content: "  async function processRetry(paymentId: string) {", type: "context" },
  { oldNum: 86, newNum: 86, content: "    const attempt = await this.getAttemptCount(paymentId);", type: "context" },
  { oldNum: 87, newNum: 87, content: "    if (attempt >= MAX_RETRIES) {", type: "context" },
  { oldNum: 88, newNum: 88, content: "      throw new RetryExhaustedError(paymentId);", type: "context" },
  { oldNum: null, newNum: 89, content: "+   const delay = Math.pow(2, attempt) * 1000;", type: "add" },
  { oldNum: null, newNum: 90, content: "+   await sleep(delay);", type: "add" },
  { oldNum: 91, newNum: 91, content: "", type: "context" },
  {
    oldNum: 92,
    newNum: 92,
    content: "    const result = await gateway.charge(paymentId);",
    type: "flagged",
    commentCount: 2,
  },
  { oldNum: null, newNum: 93, content: "+   logger.info(`Retry attempt ${attempt} for ${paymentId}`);", type: "add" },
  { oldNum: 93, newNum: 94, content: "    return result;", type: "context" },
  { oldNum: 94, newNum: 95, content: "  }", type: "context" },
];

export const chatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Why is line 92 flagged as high risk?",
    timestamp: "2:34 PM",
  },
  {
    id: "2",
    role: "ai",
    content:
      "The charge call on line 92 lacks an idempotency key. If the gateway accepts the payment but the response times out, a retry could double-charge the customer. Add `idempotencyKey` to the charge payload.",
    timestamp: "2:34 PM",
  },
  {
    id: "3",
    role: "user",
    content: "What's the recommended fix?",
    timestamp: "2:36 PM",
  },
  {
    id: "4",
    role: "ai",
    content:
      "Generate a deterministic idempotency key from `paymentId + attempt` before calling `gateway.charge()`. Most payment providers (Stripe, Adyen) support this pattern.",
    timestamp: "2:36 PM",
  },
];
