/**
 * sponsor-endpoint-snippet.ts
 *
 * REFERENCE SNIPPET — read and adapt; this file is NOT executed by the skill.
 *
 * Copy-ready Express skeleton for the endpoint you pass to the SDK as
 * `sponsorUrl` (mega.initialise({ sponsorUrl, sponsorMode, sponsorToken })).
 *
 * POLICY LIVES HERE, SERVER-SIDE. Never put allowlists, budgets, or approval
 * logic in the client — the client is public. This endpoint is the only place
 * that decides whether a given operation gets sponsored.
 *
 * Safe defaults on the client: start with sponsorMode 'app-only' + sponsorToken
 * 'native'. sponsorMode 'everything' is TESTING-ONLY — never ship it.
 *
 * Every request MUST pass three gates, in order, before approval:
 *   1. Signed-call policy  -> decode every call; reject 403 if any call fails
 *   2. Rate limit          -> reject 429 if per-user or per-IP cap exceeded
 *   3. Budget cap          -> reject 403 if daily/monthly ceiling exhausted
 * Then sign and return the sponsorship approval, or reject with a structured
 * JSON error and the correct status code.
 *
 * Replace every block marked `TODO` with real, durable infrastructure
 * (Redis / DB for counters and budgets, your paymaster signer for the payload).
 * The in-memory maps below are illustrative ONLY and reset on restart — they
 * are NOT safe for production or multi-instance deployments.
 *
 * Run: npm i express   (the request shape comes from the MOSS wallet flow)
 */

import express, { type Request, type Response } from 'express';

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Config (move to env / secrets in production)
// ---------------------------------------------------------------------------

// TODO: load the exact (target, selector) pairs and native-value caps your app
// may sponsor. Decode and validate relevant calldata arguments as well.
const CALL_POLICIES = new Map<string, { maxValue: bigint }>([
  ['0xyourprimarycontract:0x12345678', { maxValue: 0n }],
  ['0xyourrewardscontract:0x90abcdef', { maxValue: 0n }],
]);

const EXPECTED_CHAIN_ID = 4326;

// Rate-limit windows / caps — tune to your traffic.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_PER_USER_PER_WINDOW = 5;
const MAX_PER_IP_PER_WINDOW = 20;

// Budget caps in your accounting unit (e.g. wei of sponsor token, or "ops").
const DAILY_BUDGET_CAP = 10_000;

// ---------------------------------------------------------------------------
// In-memory stubs — REPLACE with Redis/DB. Not multi-instance safe.
// ---------------------------------------------------------------------------

type Counter = { count: number; windowStart: number };
const userHits = new Map<string, Counter>();
const ipHits = new Map<string, Counter>();

let dailySpent = 0;
let dailyWindowStart = Date.now();

// ---------------------------------------------------------------------------
// Gate 1 — decode the signed operation and enforce its actual calls
// ---------------------------------------------------------------------------

type DecodedOperation = {
  sender: string;
  chainId: number;
  calls: { target: string; selector: string; value: bigint }[];
};

function decodeOperation(_userOperation: unknown): DecodedOperation {
  // TODO: decode the exact operation format sent by your configured MOSS/Porto
  // integration. Derive sender, chain ID, and every inner call from the signed
  // operation itself. Never authorize a separate client-supplied target field.
  // Keep this fail-closed until the real decoder is implemented and tested.
  throw new Error('OPERATION_DECODER_NOT_IMPLEMENTED');
}

function isAllowedOperation(operation: DecodedOperation): boolean {
  if (
    operation.chainId !== EXPECTED_CHAIN_ID ||
    !/^0x[0-9a-fA-F]{40}$/.test(operation.sender) ||
    !Array.isArray(operation.calls) ||
    operation.calls.length === 0
  ) {
    return false;
  }
  return operation.calls.every(({ target, selector, value }) => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(target) || !/^0x[0-9a-fA-F]{8}$/.test(selector)) {
      return false;
    }
    if (typeof value !== 'bigint' || value < 0n) return false;
    const policy = CALL_POLICIES.get(`${target.toLowerCase()}:${selector.toLowerCase()}`);
    return !!policy && value <= policy.maxValue;
  });
}

// ---------------------------------------------------------------------------
// Gate 2 — rate limit (per-user AND per-IP)
// ---------------------------------------------------------------------------

function hitAndCheck(
  store: Map<string, Counter>,
  key: string,
  max: number,
  now: number,
): boolean {
  // TODO: replace this in-memory counter with an atomic store (e.g. Redis
  // INCR + EXPIRE, or a sliding-window/token-bucket limiter). The logic below
  // is a fixed-window stub to make the intent obvious.
  const entry = store.get(key);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Gate 3 — budget cap (daily; mirror for monthly + per-account)
// ---------------------------------------------------------------------------

function withinBudget(cost: number, now: number): boolean {
  // TODO: replace with a real ledger. Track GLOBAL and PER-ACCOUNT spend, and
  // enforce both daily AND monthly ceilings. Reserve/commit the cost atomically
  // so concurrent requests can't oversubscribe the budget.
  if (now - dailyWindowStart >= 24 * 60 * 60 * 1000) {
    dailySpent = 0;
    dailyWindowStart = now;
  }
  return dailySpent + cost <= DAILY_BUDGET_CAP;
}

function commitBudget(cost: number): void {
  // TODO: commit only after you have actually issued sponsorship.
  dailySpent += cost;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

app.post('/sponsor', async (req: Request, res: Response) => {
  const now = Date.now();

  // The MOSS wallet flow posts the proposed operation. Its exact shape depends
  // on your paymaster provider; decode that shape rather than trusting summary
  // fields supplied alongside it.
  const { userOperation } = (req.body ?? {}) as {
    userOperation?: unknown;
  };

  // Basic shape validation.
  if (!userOperation) {
    return res.status(400).json({ error: 'INVALID_REQUEST' });
  }

  let operation: DecodedOperation;
  try {
    operation = decodeOperation(userOperation);
  } catch {
    return res.status(400).json({ error: 'INVALID_OR_UNSUPPORTED_OPERATION' });
  }

  // Gate 1 — enforce every actual inner call, including batched calls.
  if (!isAllowedOperation(operation)) {
    return res.status(403).json({ error: 'OPERATION_NOT_ALLOWED' });
  }

  // Gate 2 — rate limit (per-user AND per-IP). Reject if either is exceeded.
  // `req.ip` ignores X-Forwarded-For unless Express `trust proxy` is configured.
  // Configure that setting only for known proxies.
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const okUser = hitAndCheck(userHits, operation.sender.toLowerCase(), MAX_PER_USER_PER_WINDOW, now);
  const okIp = hitAndCheck(ipHits, ip, MAX_PER_IP_PER_WINDOW, now);
  if (!okUser || !okIp) {
    return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
  }

  // Gate 3 — budget cap. Cost model is up to you (gas estimate, fixed op cost…).
  const cost = 1; // TODO: estimate the real sponsorship cost for this op.
  if (!withinBudget(cost, now)) {
    return res.status(403).json({ error: 'SPONSOR_BUDGET_EXCEEDED' });
  }

  // All gates passed — sign and approve.
  try {
    // TODO: produce the real sponsorship approval with your paymaster signer.
    // For a Porto-compatible self-hosted paymaster this is the signed
    // paymaster payload your sponsor account authorizes.
    const paymasterAndData = '0xSignedPaymasterPayload';

    commitBudget(cost);
    return res.status(200).json({ paymasterAndData });
  } catch (err) {
    // Reject quickly with a structured error on signing failure.
    return res.status(500).json({ error: 'SPONSOR_SIGNING_FAILED' });
  }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`sponsor endpoint listening on :${PORT}/sponsor`);
});
