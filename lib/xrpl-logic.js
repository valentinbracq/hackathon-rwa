import xrpl from "xrpl"
import { safeLog } from "./log"

// Enforce Devnet only runtime (prevent accidental mainnet/testnet usage)
const XRPL_NETWORK = process.env.XRPL_NETWORK || "devnet"
if (XRPL_NETWORK !== "devnet") {
  throw new Error(`XRPL_NETWORK must be 'devnet' (found: ${XRPL_NETWORK}). Abort.`)
}

const RPC_URL = process.env.XRPL_WS_URL || process.env.XRPL_RPC_URL || "wss://clio.devnet.rippletest.net:51233"
const TIMEOUT_MS = Number(process.env.NETWORK_TIMEOUT_MS ?? 20000)

// Shared MPT asset scale (human integer units -> on-ledger scaled value).
// If MPT_ASSET_SCALE undefined, default to 2 ("1" -> "100" ledger value => 1.00 displayed).
const DEFAULT_MPT_ASSET_SCALE = Number(process.env.MPT_ASSET_SCALE ?? 2);

export function getMptAssetScale() {
  return DEFAULT_MPT_ASSET_SCALE;
}

export function toMptLedgerValue(units) {
  // "units" is a human integer string, e.g. "1" token
  if (typeof units !== "string" || !/^[0-9]+$/.test(units)) {
    throw new Error("units_not_integer");
  }
  const scale = BigInt(getMptAssetScale());
  const factor = BigInt(10) ** scale;
  const raw = BigInt(units) * factor;
  return raw.toString(); // this is what goes into Amount.value
}

export function fromMptLedgerValue(raw) {
  // raw is the ledger integer (MPTAmount string)
  if (typeof raw !== "string" || !/^[0-9]+$/.test(raw)) return "0";
  const scale = BigInt(getMptAssetScale());
  const factor = BigInt(10) ** scale;
  const val = BigInt(raw) / factor;
  return val.toString(); // human integer units
}

/* ---------------- Identités et client ---------------- */

/** Wallet émetteur (ISSUER). */
export function getIssuerWallet() {
  const seed = process.env.ISSUER_SEED
  if (!seed) throw new Error("ISSUER_SEED is required")
  return xrpl.Wallet.fromSeed(seed)
}

// Cache issuer address derived once from seed (if ISSUER_ADDRESS not set explicitly)
const ENV_ISSUER_ADDRESS = (process.env.ISSUER_ADDRESS || "").trim()
let CACHED_ISSUER_ADDRESS = ENV_ISSUER_ADDRESS || (process.env.ISSUER_SEED ? (() => {
  try { return xrpl.Wallet.fromSeed(process.env.ISSUER_SEED).classicAddress } catch { return "" } })() : "")

export function getIssuerAddress() {
  if (!CACHED_ISSUER_ADDRESS) throw new Error("Issuer address not resolvable: set ISSUER_ADDRESS or ISSUER_SEED")
  return CACHED_ISSUER_ADDRESS
}

// Removed getHolderWallet(): production flow no longer loads holder seed server-side.
// If needed for local dev, reintroduce behind an explicit DEV flag.

/** Client XRPL. */
export function getClient() {
  return new xrpl.Client(RPC_URL, { timeout: TIMEOUT_MS })
}

/** Signe, soumet et attend la validation. */
export async function submitAndWait(client, tx, wallet) {
  const prepared = await client.autofill(tx)
  // Use safeLog to avoid leaking secrets (seeds) or signed blobs
  safeLog({ phase: "autofill_done", txType: tx.TransactionType, account: tx.Account })
  const { tx_blob } = wallet.sign(prepared)
  const resp = await client.submitAndWait(tx_blob, { failHard: true })
  safeLog({ phase: "submit_done", result: resp.result?.meta?.TransactionResult, hash: resp.result?.hash })
  if (resp.result?.meta?.TransactionResult !== "tesSUCCESS") {
    throw new Error(`XRPL tx failed: ${resp.result?.meta?.TransactionResult}`)
  }
  return resp
}

/* ---------------- Vérifications protocole ---------------- */

/** Vérifie que MPTokensV1 est activé. */
export async function assertMPTokensV1(client) {
  try {
    const fl = await client.request({ command: "feature" })
    const features = Object.values(fl?.result?.features || {})
    const hit = features.find(v => v?.name === "MPTokensV1" || v?.alias === "MPTokensV1")
    if (hit && (hit.enabled === true || hit.supported === true)) return
  } catch (e) {
    console.log("[debug] feature(list) error:", e?.message || e)
  }
  try {
    const ft = await client.request({ command: "feature", feature: "MPTokensV1" })
    const fmap = ft?.result?.features || {}
    const any = Object.values(fmap)[0]
    if (any && (any.enabled === true || any.supported === true)) return
  } catch {}
  throw new Error("MPTokensV1 not enabled on this server")
}

/* ---------------- Lecture état MPT ---------------- */

/** Liste les issuances MPT de l’émetteur. */
export async function listIssuerMPTIssuances(client, issuer) {
  const res = await client.request({
    command: "account_objects",
    account: issuer,
    ledger_index: "validated",
    type: "MPTokenIssuance"
  })
  return (res.result?.account_objects || []).map(o => ({
    id: o.mpt_issuance_id || o.MPTokenIssuanceID,
    flags: o.Flags >>> 0,
    seq: o.Sequence >>> 0
  }))
}

/** Lit le solde MPT d’un compte pour une issuance. */
export async function readMPTBalance(mptIssuanceId, account) {
  const client = getClient()
  await client.connect()
  try {
    const le = await client.request({
      command: "ledger_entry",
      mptoken: { mpt_issuance_id: mptIssuanceId, account },
      ledger_index: "validated"
    })
    const node = le.result?.node
    const raw = node?.MPTAmount
    return raw ? fromMptLedgerValue(String(raw)) : "0"
  } catch {
    return "0"
  } finally {
    await client.disconnect()
  }
}

/* ---------------- Opérations MPT ---------------- */

/** Crée une issuance MPT avec CanTransfer + RequireAuth + CanClawback. */
export async function createMPTIssuanceWithClawback(opts = {}) {
  const issuer = getIssuerWallet()
  const client = getClient()
  await client.connect()
  try {
    await assertMPTokensV1(client)

    const preset = process.env.MPT_ISSUANCE_ID?.trim()
    if (preset) return preset

    const existing = await listIssuerMPTIssuances(client, issuer.classicAddress)
    const needFlags =
      xrpl.MPTokenIssuanceCreateFlags.tfMPTCanTransfer |
      xrpl.MPTokenIssuanceCreateFlags.tfMPTRequireAuth |
      xrpl.MPTokenIssuanceCreateFlags.tfMPTCanClawback

    for (const it of existing) {
      if (typeof it.id === "string" && (it.flags & needFlags) === needFlags) {
        return it.id
      }
    }

    const tx = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: issuer.classicAddress,
  AssetScale: opts.assetScale ?? getMptAssetScale(),
      MaximumAmount: opts.maximumAmount ?? "9223372036854775807",
      TransferFee: opts.transferFee ?? 0,
      MPTokenMetadata: opts.metadataHex,
      Flags: needFlags
    }
    await submitAndWait(client, tx, issuer)

    const after = await listIssuerMPTIssuances(client, issuer.classicAddress)
    const latest = after.sort((a, b) => b.seq - a.seq)[0]
    if (!latest?.id) throw new Error("Unable to determine mpt_issuance_id after creation")
    return latest.id
  } finally {
    await client.disconnect()
  }
}

/** Autorise un holder pour une issuance (opt-in + allow-list). */
export async function authorizeHolderForIssuance(mptIssuanceId, holderClassic) {
  // Holder must have already performed on-ledger opt-in from their own wallet.
  const issuer = getIssuerWallet()
  const client = getClient()
  await client.connect()
  try {
    await assertMPTokensV1(client)

    async function readMPToken() {
      try {
        const le = await client.request({
          command: "ledger_entry",
          mptoken: { mpt_issuance_id: mptIssuanceId, account: holderClassic },
          ledger_index: "validated"
        })
        return le.result?.node || null
      } catch {
        return null
      }
    }

    const before = await readMPToken()
    const alreadyHasObject = !!before
    const LSF_AUTH = (xrpl.LedgerEntry?.MPTokenFlags?.lsfMPTAuthorized) ?? 0x00000002
    const alreadyAuthorized = alreadyHasObject && ((before.Flags >>> 0) & LSF_AUTH) !== 0
    if (alreadyAuthorized) return { optIn: true, granted: true, skipped: true }

    // We no longer submit holder's opt-in (requires holder signature client-side).
    // If object absent, we return status so frontend can prompt user to sign opt-in.
    if (!alreadyHasObject) {
      return { optIn: false, granted: false }
    }

    try {
      const grantTx = {
        TransactionType: "MPTokenAuthorize",
        Account: issuer.classicAddress,
        MPTokenIssuanceID: mptIssuanceId,
        Holder: holderClassic
      }
      await submitAndWait(client, grantTx, issuer)
    } catch (e) {
      const msg = String(e?.message || "")
      if (!msg.includes("tecDUPLICATE")) throw e
    }

    const after = await readMPToken()
    const ok = !!after && (((after.Flags >>> 0) & LSF_AUTH) !== 0)
    if (!ok) throw new Error("MPTokenAuthorize non effectif: flags non autorisés.")
    return { optIn: true, granted: true }
  } finally {
    await client.disconnect()
  }
}

/** DEV-ONLY: le holder s'auto inscrit (opt-in) via son seed local. */
// DEV-ONLY helper removed: holderOptInWithSeed. Use prepareHolderOptInTx + client-side signing instead.

/** Build and autofill an unsigned MPTokenAuthorize for the holder to sign client-side. */
export async function prepareHolderOptInTx(mptIssuanceId, holderClassic) {
  const client = getClient();
  await client.connect();
  try {
    await assertMPTokensV1(client);
    const base = buildHolderAuthorizeTx({ holderAddress: holderClassic, issuanceId: mptIssuanceId });
    const prepared = await client.autofill(base);
    return {
      ...prepared,
      SigningPubKey: "", // wallet will supply
      TxnSignature: ""   // unsigned
    };
  } finally {
    await client.disconnect();
  }
}

/** Envoie des unités MPT depuis l’issuer vers un compte. */
export async function sendMPT(mptIssuanceId, destClassic, units) {
  const issuer = getIssuerWallet()
  const client = getClient()
  await client.connect()
  try {
    await assertMPTokensV1(client)
    assertWholeAmountString(units)
    // Scale human integer units -> ledger value according to AssetScale.
    const value = toMptLedgerValue(units)
    const amount = { mpt_issuance_id: mptIssuanceId, value }
    const tx = {
      TransactionType: "Payment",
      Account: issuer.classicAddress,
      Destination: destClassic,
      Amount: amount
    }
    try {
      return await submitAndWait(client, tx, issuer)
    } catch (e) {
      if (String(e.message).includes("tecNO_AUTH")) {
        throw new Error("tecNO_AUTH: le holder doit OPT-IN puis l’issuer doit l’autoriser.")
      }
      throw e
    }
  } finally {
    await client.disconnect()
  }
}

/** Clawback d’unités MPT depuis un holder. */
export async function clawbackMPT(mptIssuanceId, holderClassic, units) {
  const issuer = getIssuerWallet()
  const client = getClient()
  await client.connect()
  try {
    await assertMPTokensV1(client)
    assertWholeAmountString(units)
    // Apply same scaling as sendMPT for symmetry
    const value = toMptLedgerValue(units)
    const amount = { mpt_issuance_id: mptIssuanceId, value }
    const tx = {
      TransactionType: "Clawback",
      Account: issuer.classicAddress,
      Amount: amount,
      Holder: holderClassic
    }
    return await submitAndWait(client, tx, issuer)
  } finally {
    await client.disconnect()
  }
}

export function assertAddress(addr) {
  if (!/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(addr)) throw new Error("Invalid XRPL address");
}
export function assertPositiveAmount(v) {
  if (isNaN(v) || Number(v) <= 0) throw new Error("Amount must be > 0");
}
export function assertWholeAmountString(v) {
  const s = String(v);
  if (!/^[0-9]+$/.test(s)) throw new Error("Amount must be a non-negative integer string");
  if (s === "0") throw new Error("Amount must be > 0");
}

/* ---------------- Native XRP helpers & payment validation ---------------- */
// 1 XRP = 1,000,000 drops
export const DROPS_PER_XRP = 1_000_000;

/** Convert a drops string ("1000000") to an XRP string with trimmed trailing zeros ("1", "1.23"). */
export function dropsToXrpString(drops) {
  const n = BigInt(drops);
  const int = n / BigInt(DROPS_PER_XRP);
  const frac = n % BigInt(DROPS_PER_XRP);
  if (frac === 0n) return `${int.toString()}`;
  const s = frac.toString().padStart(6, "0");
  return `${int.toString()}.${s}`.replace(/\.?0+$/, "");
}

/** Convert a whole XRP integer string (e.g. "1", "2", "10") to a drops string. */
export function xrpToDropsString(xrpIntString) {
  if (!/^[0-9]+$/.test(xrpIntString)) throw new Error("xrp_units_must_be_integer");
  return (BigInt(xrpIntString) * BigInt(DROPS_PER_XRP)).toString();
}

/** Assert a native XRP Payment's Amount field matches expected integer XRP units. */
export function assertXrpPaymentMatchesUnits(amountField, units) {
  // For native XRP, Amount is a string of drops.
  if (typeof amountField !== "string" || !/^[0-9]+$/.test(amountField)) {
    throw new Error("amount_not_xrp_drops");
  }
  if (!/^[0-9]+$/.test(units)) throw new Error("units_not_integer");
  const expected = xrpToDropsString(units);
  if (amountField !== expected) {
    throw new Error(`price_mismatch_drops:${amountField}!=${expected}`);
  }
}

// Deprecated legacy pricing assertion (if previously existed). Kept for safety.
export function assertRlUSDPricing() {
  throw new Error("assertRlUSDPricing deprecated: use assertXrpPaymentMatchesUnits");
}

/**
 * Parse a Crown payment memo of the form:
 *   PAY-CROWN|<issuanceId>|<nonce>|<units>
 */
export function parseCrownMemo(memos = []) {
  try {
    for (const m of memos) {
      const hex = m?.Memo?.MemoData;
      if (!hex) continue;

      // Décodage + suppression des espaces / retours à la ligne
      const text = xrpl.convertHexToString(hex).trim();
      if (!text.startsWith("PAY-CROWN|")) continue;

      const [tag, issuanceId, nonce, units] = text.split("|");
      if (!issuanceId || !nonce || !units) throw new Error("Malformed memo");
      if (!/^[0-9]+$/.test(units)) throw new Error("units_not_integer");

      return { issuanceId, nonce, units, unitsIntString: units, raw: text };
    }
  } catch (e) {
    console.warn("[parseCrownMemo] failed", e);
  }
  return null;
}


/** Basic format guard for UUID-like nonces (hex with dashes, >=8 chars). */
export function assertUuidish(nonce) {
  if (!/^[0-9a-fA-F-]{8,}$/.test(String(nonce))) throw new Error("Invalid nonce");
}

/** Strict check that a Payment Amount is an IOU to a given issuer/currency. */
export function isIOUAmountToIssuer(amt, issuer, currency) {
  return typeof amt === "object"
    && amt?.issuer === issuer
    && amt?.currency === currency
    && typeof amt?.value === "string";
}

/** L’émetteur accorde explicitement l’autorisation à un holder qui a déjà opt-in. */
export async function grantHolder(mptIssuanceId, holderClassic) {
  const client = getClient()
  const issuer = getIssuerWallet()
  await client.connect()
  try {
    await assertMPTokensV1(client)
    const tx = {
      TransactionType: "MPTokenAuthorize",
      Account: issuer.classicAddress,
      MPTokenIssuanceID: mptIssuanceId,
      Holder: holderClassic
    }
    return await submitAndWait(client, tx, issuer)
  } finally {
    await client.disconnect()
  }
}

/**
 * Pure builder for a holder authorization (opt-in) transaction skeleton.
 * Does NOT sign, submit or perform network calls. Idempotent.
 *
 * @param {{ holderAddress: string, issuanceId: string }} params
 * @returns {object} txjson for MPTokenAuthorize
 */
export function buildHolderAuthorizeTx({ holderAddress, issuanceId }) {
  assertAddress(holderAddress)
  assertUuidish(issuanceId)
  const issuerAddress = getIssuerAddress()

  return {
    TransactionType: "MPTokenAuthorize",
    Account: holderAddress,
    Issuer: issuerAddress,
    MPTokenIssuanceID: issuanceId
  }
}

/**
 * Verify, on Devnet, that a holder-signed MPTokenAuthorize transaction is validated
 * and matches the expected account and issuance id.
 *
 * @param {{ txid: string, expectedAccount: string, expectedIssuanceId: string }} params
 * @returns {Promise<{ ok: true }>} Resolves when assertions pass, otherwise throws.
 */
export async function verifySignedOptInOnDevnet({ txid, expectedAccount, expectedIssuanceId }) {
  if (!txid || typeof txid !== "string") throw new Error("txid is required")
  assertAddress(expectedAccount)
  assertUuidish(expectedIssuanceId)

  const client = getClient()
  await client.connect()
  try {
    const resp = await client.request({ command: "tx", transaction: txid })
    const r = resp?.result
    if (!r) throw new Error("Transaction not found")
    if (!r.validated) throw new Error("Transaction not validated yet")

    const { Account, TransactionType, MPTokenIssuanceID } = r

    if (TransactionType !== "MPTokenAuthorize") {
      throw new Error(`Wrong transaction type: expected MPTokenAuthorize, got ${TransactionType || "unknown"}`)
    }
    if (Account !== expectedAccount) {
      throw new Error(`Account mismatch: expected ${expectedAccount}, got ${Account}`)
    }
    if (MPTokenIssuanceID !== expectedIssuanceId) {
      throw new Error(`IssuanceId mismatch: expected ${expectedIssuanceId}, got ${MPTokenIssuanceID}`)
    }

    return { ok: true }
  } finally {
    await client.disconnect()
  }
}

// at the bottom of /lib/xrpl-logic.js
const core = {
  // requested production-safe exports
  prepareHolderOptInTx,
  grantHolder,
  buildHolderAuthorizeTx,
  getIssuerAddress,
  verifySignedOptInOnDevnet,
  sendMPT,
  clawbackMPT,
  readMPTBalance,
  createMPTIssuanceWithClawback,
  listIssuerMPTIssuances,
  assertMPTokensV1,
  assertAddress,
  assertPositiveAmount,
  assertWholeAmountString,
  parseCrownMemo,
  assertUuidish,
  isIOUAmountToIssuer,
  DROPS_PER_XRP,
  dropsToXrpString,
  xrpToDropsString,
  assertXrpPaymentMatchesUnits,
  assertRlUSDPricing,
  getMptAssetScale,
  toMptLedgerValue,
  fromMptLedgerValue,
  

  // legacy / internal helpers (kept for existing imports; can be pruned later)
  getClient,
  getIssuerWallet,
  authorizeHolderForIssuance,
};

export default core;

