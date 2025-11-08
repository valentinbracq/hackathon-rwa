/**
 * Minimal XUMM (Xaman) client helper for server-side usage in Next.js.
 *
 * Notes:
 * - Requires XUMM API credentials via environment variables.
 * - Pure functions, no persistence. Uses native fetch.
 * - Do not import this file in client components (it uses server secrets).
 */

const BASE_URL = "https://xumm.app/api/v1/platform/payload" as const;

// Enforce Devnet usage for this hackathon environment.
const XRPL_NETWORK = process.env.XRPL_NETWORK || "devnet";
if (XRPL_NETWORK !== "devnet") {
  throw new Error(`XRPL_NETWORK must be 'devnet' (found: ${XRPL_NETWORK}). Refusing to start.`);
}

function getEnvCredentials() {
  const apiKey = process.env.XUMM_API_KEY;
  const apiSecret = process.env.XUMM_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "Missing XUMM credentials. Please set XUMM_API_KEY and XUMM_API_SECRET in your environment."
    );
  }
  return { apiKey, apiSecret };
}

export type CreateSignRequestOptions = {
  /** Expiration in seconds for the signing request. If omitted, the XUMM default is used. */
  expiresIn?: number;
};

// Public response type for creating a XUMM sign request.
// Only uuid and next.always are required; QR related fields are optional.
export type XummCreateResponse = {
  uuid: string;
  refs?: {
    qr_png?: string; // optional PNG QR image data URL
    qr_svg?: string; // optional SVG QR image data URL
    qr_matrix?: number[][]; // optional raw QR matrix (1/0 entries)
    websocket_status?: string; // optional WebSocket status endpoint
  };
  next?: { always?: string }; // redirect URL provided by XUMM
};

/**
 * Create a XUMM payload for signing and return essential references.
 */
export async function createSignRequest(
  txjson: Record<string, any>,
  options?: CreateSignRequestOptions
): Promise<XummCreateResponse> {
  const { apiKey, apiSecret } = getEnvCredentials();

  const body: any = {
    txjson,
    options: {
      submit: true,
    },
  };
  if (typeof options?.expiresIn === "number") {
    const expire = Math.max(0, Math.floor(options.expiresIn));
    body.options.expire = expire;
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await safeText(res);
    throw new Error(`XUMM create payload failed (${res.status}): ${text}`);
  }

  const raw = await res.json();
  // Perform minimal validation: only uuid & next.always must exist.
  const uuid = requireField(raw.uuid, "uuid");
  const nextAlways = requireField(raw.next?.always, "next.always");
  const data: XummCreateResponse = {
    uuid,
    refs: raw.refs, // leave optional fields as-is (may be undefined)
    next: { always: nextAlways },
  };
  return data;
}

export type PayloadStatus = {
  uuid: string;
  resolved: boolean;
  signed: boolean;
  txid?: string;
  account?: string;
  /** Present when provided by XUMM after dispatch */
  dispatched_result?: string;
};

type XummPayloadStatusWire = {
  meta?: { uuid?: string; resolved?: boolean; expired?: boolean };
  response?: { signed?: boolean; txid?: string | null; account?: string | null };
};

/**
 * Retrieve the minimal status of an existing XUMM payload.
 */
export async function getPayloadStatus(uuid: string): Promise<PayloadStatus> {
  if (!uuid || typeof uuid !== "string") {
    throw new Error("getPayloadStatus: 'uuid' must be a non-empty string");
  }

  const key = process.env.XUMM_API_KEY;
  const sec = process.env.XUMM_API_SECRET;
  if (!key || !sec) {
    const e: any = new Error("xumm_env_missing");
    e.status = 500;
    throw e;
  }

  const url = `https://xumm.app/api/v1/platform/payload/${encodeURIComponent(uuid)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": key,
      "X-API-Secret": sec,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  // Map common XUMM statuses to throwables with .status for the API route
  if (res.status === 404 || res.status === 410) {
    const e: any = new Error("xumm_not_found");
    e.status = res.status;
    throw e;
  }
  if (res.status === 429) {
    const e: any = new Error("xumm_rate_limited");
    e.status = 429;
    throw e;
  }
  if (res.status >= 500) {
    const e: any = new Error("xumm_upstream_error");
    e.status = res.status;
    throw e;
  }

  let json: XummPayloadStatusWire;
  try {
    json = (await res.json()) as XummPayloadStatusWire;
  } catch {
    const e: any = new Error("xumm_bad_json");
    e.status = 502;
    throw e;
  }

  const resolved = !!json?.meta?.resolved;
  const signed = !!json?.response?.signed;
  const txid = json?.response?.txid ?? null;
  const account = json?.response?.account ?? null;
  const uuidEcho = json?.meta?.uuid || uuid;

  const out: PayloadStatus = {
    uuid: uuidEcho,
    resolved,
    signed,
  };
  if (typeof txid === "string") out.txid = txid;
  if (typeof account === "string") out.account = account;
  return out;
}

// ---------- internals ----------

function requireField<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`XUMM response missing required field: ${name}`);
  }
  return value as T;
}

async function safeText(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text?.slice(0, 500) || ""; // avoid dumping huge body
  } catch {
    return "";
  }
}

