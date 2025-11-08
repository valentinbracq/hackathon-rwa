import { salesStore } from "@/lib/pending-sales";
// Ensure XRPL payments listener is auto-started on first route hit (server-only)
import "@/app/api/_worker/auto-start-listener";

export const runtime = 'nodejs'

export async function GET() {
  const items = Array.from(salesStore.pendingSales.entries()).map(([key, v]: any) => {
    const paymentTx = v.paymentTx ?? (v as any).hash_payment ?? key;
    const createdAtIso = typeof v.createdAt === "string"
      ? v.createdAt
      : new Date((typeof v.createdAt === "number" ? v.createdAt : Date.now())).toISOString();
    const createdAtMs = Date.parse(createdAtIso);
    return {
      amount_xrp: v.amount_xrp,
      amount_drops: v.amount_drops,
      units: v.units,
      holder: v.holder,
      issuanceId: v.issuanceId,
      status: v.status,
      paymentTx,
      createdAt: createdAtIso,
      __createdAtMs: isNaN(createdAtMs) ? 0 : createdAtMs,
    };
  });

  // Sort by createdAt desc
  items.sort((a: any, b: any) => (b.__createdAtMs - a.__createdAtMs));

  // Strip internal field and return only requested shape
  const out = items.map(({ __createdAtMs, ...rest }: any) => rest);
  console.log(
    JSON.stringify(
      {
        route: "/api/mpt/sales/list",
        itemsCount: out.length,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  return new Response(JSON.stringify({ items: out }), { status: 200 });
}
