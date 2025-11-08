import core, { parseCrownMemo, dropsToXrpString, assertXrpPaymentMatchesUnits, assertAddress } from "@/lib/xrpl-logic";
import { salesStore, nonceSeen } from "@/lib/pending-sales";

/**
 * Attempt to ingest a validated successful XRP Payment to the issuer that matches our memo format.
 * Returns true if a new pending sale record was added, false otherwise.
 */
export async function tryIngestPaymentTx(opts: {
  tx: any;
  meta: any;
  validated: boolean;
  source: string; // "live" | "rescan" etc for logging context
}): Promise<boolean> {
  const { tx, meta, validated, source } = opts;
  try {
    const issuer = core.getIssuerAddress();
    const hash = meta?.transaction_hash || tx?.hash;
    const engine = meta?.TransactionResult;
    if (!hash) return false;

    // Skip if already present
    if ((salesStore as any).pendingSales.has(hash)) return false;

    // Require validated success
    if (!validated) return false;
    if (engine !== "tesSUCCESS") return false;

    // Only native XRP Payment to issuer
    if (!tx || tx.TransactionType !== "Payment") return false;
    if (tx.Destination !== issuer) return false;
    if (typeof tx.Amount !== "string") return false;

    // Extract first matching PAY-CROWN memo text across all memos
    function extractMemoText(memos?: any[]): string | null {
      if (!Array.isArray(memos)) return null;
      for (const m of memos) {
        const hex = m?.Memo?.MemoData;
        if (!hex) continue;
        try {
          const s = Buffer.from(hex, "hex").toString("utf8").trim();
          if (s.startsWith("PAY-CROWN|")) return s;
        } catch { /* ignore */ }
      }
      return null;
    }
    const mtext = extractMemoText(tx.Memos);
    if (!mtext) return false;

    // Parse memo structure
  const parsed = parseCrownMemo(tx.Memos || []) as any || null;
    let issuanceId: string | undefined;
    let nonce: string | undefined;
    let unitsStr: string | undefined;
    if (parsed && (parsed.issuanceId && parsed.nonce && (parsed.units || parsed.unitsIntString))) {
      issuanceId = parsed.issuanceId;
      nonce = parsed.nonce;
      unitsStr = parsed.units ?? parsed.unitsIntString;
    } else if (typeof mtext === "string" && mtext.startsWith("PAY-CROWN|")) {
      const parts = mtext.split("|");
      if (parts.length >= 4) {
        issuanceId = parts[1];
        nonce = parts[2];
        unitsStr = parts[3];
      }
    }
    if (!issuanceId || !nonce || !unitsStr) return false;
    if (!/^[0-9]+$/.test(unitsStr)) return false;

    // Guards & pricing validation
    assertAddress(tx.Account);
    assertXrpPaymentMatchesUnits(tx.Amount, unitsStr);

    // Anti-replay
    if (nonceSeen(nonce) || (salesStore as any).usedNonces?.has(nonce)) return false;

    const record = {
      status: "pending",
      hash_payment: hash,
      holder: tx.Account,
      issuanceId,
      nonce,
      units: parseInt(unitsStr, 10),
      amount_drops: tx.Amount,
      amount_xrp: dropsToXrpString(tx.Amount),
      createdAt: Date.now(),
    } as any;
    (salesStore as any).pendingSales.set(hash, record);
    (salesStore as any).usedNonces.add(nonce);

    // Structured success log (keep lightweight to avoid noise during large rescans)
    if (source === "live") {
      console.info(JSON.stringify({
        event: "payment_detected",
        kind: "xrp",
        hash,
        from: tx.Account,
        to: tx.Destination,
        amount_drops: tx.Amount,
        issuanceId,
        nonce,
        units: unitsStr,
      }));
    }
    return true;
  } catch (e: any) {
    // Swallow errors for resilience; caller decides if needed.
    console.warn("tryIngestPaymentTx error", e?.message || e);
    return false;
  }
}
