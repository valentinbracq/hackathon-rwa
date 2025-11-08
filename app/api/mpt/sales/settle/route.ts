import core from "@/lib/xrpl-logic";
import { salesStore, isWhitelisted } from "@/lib/pending-sales";
import { startPaymentsListener } from "@/app/api/_worker/payments-listener";

export const runtime = 'nodejs'

function ok400(msg: string) { return new Response(msg, { status: 400 }); }

export async function POST(req: Request) {
  try {
    await startPaymentsListener();

    const { paymentTx } = await req.json();
    if (!paymentTx) return ok400("paymentTx required");

    const entry = salesStore.pendingSales.get(paymentTx);
    if (!entry) return new Response("Unknown sale", { status: 404 });

    // Debug: observe whitelist state before enforcing
    try {
      console.log("[settle] about to settle sale", {
        paymentTx,
        holder: entry.holder,
        whitelisted: isWhitelisted(entry.holder),
      });
    } catch {}

    // whitelist gate (optional; can be disabled)
    if (isWhitelisted && typeof isWhitelisted === "function" && !isWhitelisted(entry.holder)) {
      return ok400("Holder not whitelisted");
    }

    // Ensure MPT feature
    const client = core.getClient(); await client.connect(); await core.assertMPTokensV1(client); await client.disconnect();

    // Idempotent grant
    try { await core.grantHolder(entry.issuanceId, entry.holder); } catch {}

    // Pricing validation removed: rely solely on 'units' captured at listener time.
    // (Previously validated against XRP payment; we now trust earlier assertion.)

    // Send MPT units
    const tx = await core.sendMPT(entry.issuanceId, entry.holder, entry.units);

    // Remove settled sale from pending list (Option A: delete, no history kept)
    salesStore.pendingSales.delete(paymentTx);
    console.log("[settle] removed pending sale after MPT sent", { paymentTx });

    console.log(JSON.stringify({
      route: "/api/mpt/sales/settle",
      paymentTx,
      mptIssuanceId: entry.issuanceId,
      sendHash: tx.result.hash,
      holder: entry.holder,
      units: entry.units,
      timestamp: new Date().toISOString()
    }));

    return new Response(JSON.stringify({ hash: tx.result.hash }), { status: 200 });
  } catch (e:any) {
    const msg = e?.message || "Settle failed";
    return new Response(msg, { status: /required|Invalid XRPL address|Amount must/i.test(msg) ? 400 : 500 });
  }
}
