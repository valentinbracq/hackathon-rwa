import core, { assertXrpPaymentMatchesUnits, dropsToXrpString, parseCrownMemo } from "@/lib/xrpl-logic";
import { salesStore, whitelistAdd } from "@/lib/pending-sales";

// Global guard declaration (survives HMR / multiple module loads in Next dev)
declare global {
  // eslint-disable-next-line no-var
  var __paymentsListenerStarted: boolean | undefined;
}

let started = false;

export async function startPaymentsListener() {
  // Idempotent guards: local module flag + global flag for Next dev re-imports
  if (started || globalThis.__paymentsListenerStarted) return;
  started = true;
  globalThis.__paymentsListenerStarted = true;
  console.info(JSON.stringify({ event: "listener_start_initiated", timestamp: new Date().toISOString() }));

  const client = core.getClient();
  await client.connect();

  // Resolve issuer address (from env or seed)
  const issuer = core.getIssuerAddress();

  // Ensure subscription to account and transaction stream (reliably receive validated txs)
  await client.request({ command: "subscribe", accounts: [issuer], streams: ["transactions"] });
  console.info(JSON.stringify({ event: "listener_subscribed", issuer }));

  client.on("transaction", async (ev: any) => {
    const tx = ev?.transaction || ev?.tx || ev;
    const meta = ev?.meta || ev?.metaData || {};
    const validated = ev?.validated === true;
    await tryIngestPaymentTx({ tx, meta, validated, source: "live" });
  });
}

// Export a shared ingestion tolerant to both sources (live/rescan/manual)
export async function tryIngestPaymentTx({
  tx,
  meta,
  validated,
  source,
}: {
  tx: any;
  meta: any;
  validated?: boolean;
  source: "live" | "rescan" | "manual";
}) {
  try {
    // Normalize shapes (tolerant to tx_json/tx/meta nesting from rippled)
    const _tx = (tx as any)?.tx_json ?? (tx as any)?.tx ?? tx;
    const _meta = (meta as any) ?? (tx as any)?.meta ?? (tx as any)?.metaData ?? null;
    const _validated = Boolean(validated ?? (tx as any)?.validated ?? false);

    if (!_validated) return;
    if (_tx?.TransactionType !== "Payment") return;

    const ISSUER_ADDRESS = core.getIssuerAddress();
    if (_tx?.Destination !== ISSUER_ADDRESS) {
      const hash = _meta?.transaction_hash || _tx?.hash || (tx as any)?.hash;
      console.warn("[payments-listener] skip payment", { hash, reason: "invalid memo or wrong destination" });
      return;
    }

    const hash =
      _meta?.transaction_hash ||
      _tx?.hash ||
      (tx as any)?.hash ||
      _meta?.transaction_hash ||
      null;

    // Helper to extract native XRP amount in drops
    function getXrpDrops(T: any, M: any) {
      const v = T?.Amount ?? T?.DeliverMax ?? M?.delivered_amount ?? null;
      if (!v) return null;
      return typeof v === "string" ? v : null;
    }
    const drops = getXrpDrops(_tx, _meta);
    if (!drops) {
      console.info(
        JSON.stringify({
          event: "payment_rejected",
          reason: "amount_missing",
          hash,
          source,
        }),
      );
      console.warn("[payments-listener] skip payment", { hash, reason: "amount_missing" });
      return;
    }

    // Parse memo (PAY-CROWN|<issuanceId>|<nonce>|<units>) directly from tx.Memos
    const parsed = parseCrownMemo(_tx?.Memos);
    if (!parsed) {
      console.warn("[payments-listener] skip payment", { hash, reason: "invalid memo or wrong destination" });
      return;
    }
    const { issuanceId, nonce, units } = parsed;

    // Nouvelle logique nonce:
    // 1) si le nonce est déjà vu pour la même tx -> événement dupliqué, on ignore
    // 2) sinon on accepte en dev, on log seulement l’anomalie éventuelle
    if (salesStore.usedNonces.has(nonce)) {
      const existing = Array.from(salesStore.pendingSales.values()).find((ps) => ps.nonce === nonce);

      if (existing && existing.paymentTx === hash) {
        // même nonce + même tx -> double notification, on ignore
        console.info(
          JSON.stringify({
            event: "payment_duplicate",
            reason: "already_pending_same_tx",
            nonce,
            hash,
            source,
          }),
        );
        return;
      }

      // Nonce déjà utilisé mais pour une autre tx.
      // En dev on ne rejette plus, on log seulement.
      console.warn("[payments-listener] nonce already seen but accepting", {
        nonce,
        hash,
        source,
      });
      // Pas de return: on continue le flux normal
    }

    // Validate price exactness in drops
    assertXrpPaymentMatchesUnits(drops, units);

    // Canonical persist into pending sales via store method
    const record = {
      status: "received" as const,
      paymentTx: hash,
      holder: _tx.Account,
      issuanceId,
      nonce,
      units: String(parseInt(units, 10)),
      amount_drops: drops,
      amount_xrp: dropsToXrpString(drops),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    salesStore.addPending(record);
    // Auto-whitelist holder after accepting a valid PAY-CROWN payment
    try {
      whitelistAdd(_tx.Account);
      console.log("[payments-listener] auto-whitelisted holder for sale", {
        holder: _tx.Account,
        paymentTx: hash,
        issuanceId,
        nonce,
        units: record.units,
      });
    } catch (e) {
      console.warn("[payments-listener] failed to auto-whitelist holder", {
        err: (e as any)?.message ?? String(e),
        holder: _tx.Account,
        paymentTx: hash,
      });
    }
    console.log("[payments-listener] added pending sale", {
      hash,
      holder: _tx.Account,
      issuanceId,
      nonce,
      units: record.units,
    });
  } catch (e: any) {
    const _meta = (meta as any) ?? (tx as any)?.meta ?? (tx as any)?.metaData ?? null;
    const hash = _meta?.transaction_hash || (tx as any)?.hash;
    console.warn(
      JSON.stringify({
        event: "payment_ingest_error",
        source,
        reason: e?.message ?? "unknown",
        hash,
      }),
    );
  }
}

// extractMemoText removed in favor of parseCrownMemo from xrpl-logic
