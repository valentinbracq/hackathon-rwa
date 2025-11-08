// Centralized, secret-safe logging helper.
// Ensures we never emit seeds or private keys in logs.

type AnyObj = Record<string, any>;

const SECRET_KEYS = new Set([
  "seed",
  "secret",
  "privateKey",
  "private_key",
  "xpriv",
]);

// XRPL family seed pattern (base58, often starts with 's' like sEd...)
const XRPL_SEED_REGEX = /\b(s[1-9A-HJ-NP-Za-km-z]{20,45})\b/g;

function redactValue(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v === "string") {
    let s = v;
    // Redact exact env seed values if present
  const issuerSeed = process.env.ISSUER_SEED;
  if (issuerSeed && s.includes(issuerSeed)) s = s.split(issuerSeed).join("<redacted:seed>");
    // Redact XRPL-looking seeds
    s = s.replace(XRPL_SEED_REGEX, "<redacted:seed>");
    return s;
  }
  if (Array.isArray(v)) return v.map(redactValue);
  if (typeof v === "object") {
    const out: AnyObj = {};
    for (const [k, val] of Object.entries(v as AnyObj)) {
      if (SECRET_KEYS.has(k.toLowerCase())) {
        out[k] = "<redacted:secret>";
      } else {
        out[k] = redactValue(val);
      }
    }
    return out;
  }
  return v;
}

export function safeLog(obj: unknown) {
  try {
    const redacted = redactValue(obj);
    const line = JSON.stringify(redacted, null, 2);
    // eslint-disable-next-line no-console
    console.log(line);
  } catch (e) {
    // Fallback to plain log if stringify fails
    const fallback = {
      log: "<unserializable payload>",
      error: (e as any)?.message || String(e) || "",
      timestamp: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(fallback));
  }
}
