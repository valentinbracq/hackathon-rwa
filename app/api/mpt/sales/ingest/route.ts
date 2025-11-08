import { NextResponse } from "next/server";
import { getClient } from "@/lib/xrpl-logic";
import { tryIngestPaymentTx } from "@/app/api/_worker/payments-listener";
import { salesStore } from "@/lib/pending-sales";

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { hash } = await req.json();
  if (!/^[A-F0-9]{64}$/i.test(String(hash || ""))) {
    return NextResponse.json({ ok: false, error: "bad_hash" }, { status: 400 });
  }

  const client = getClient();
  await client.connect();
  try {
    const raw: any = await client.request({ command: "tx", transaction: hash });
    const base: any = raw?.result?.result ?? raw?.result ?? raw;
    const tx: any = base?.tx_json ?? base?.tx ?? base;
    const meta: any = base?.meta ?? base?.metaData ?? null;

    const before = salesStore.pendingSales.size;
    const memoHex = tx?.Memos?.[0]?.Memo?.MemoData;
    console.log("[ingest] fetched tx", {
      hasMeta: Boolean(meta),
      validatedFlag: base?.validated,
      dest: tx?.Destination,
      memoHex,
    });

    await tryIngestPaymentTx({
      tx,
      meta,
      validated: Boolean(base?.validated ?? true),
      source: "manual",
    });

    const after = salesStore.pendingSales.size;
    const sample = salesStore.pendingSales.get(tx.hash);
    console.log("[ingest]", { before, after, hash: tx.hash, sampleExists: Boolean(sample) });

    return NextResponse.json({
      ok: true,
      before,
      after,
      sample: sample ? { paymentTx: sample.paymentTx, holder: sample.holder, status: sample.status } : null,
    });
  } finally {
    await client.disconnect();
  }
}