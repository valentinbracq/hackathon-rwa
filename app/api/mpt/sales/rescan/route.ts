import { NextResponse } from "next/server";
import { getClient, getIssuerAddress } from "@/lib/xrpl-logic";
import { tryIngestPaymentTx } from "@/app/api/_worker/payments-listener";

export const runtime = 'nodejs'

function ok(status: number, body: any) {
  return NextResponse.json(body, { status });
}

// Decode first memo hex -> utf8 text
function memoText(memos?: any[]): string | null {
  if (!Array.isArray(memos) || memos.length === 0) return null;
  const md = memos[0]?.Memo?.MemoData;
  if (!md) return null;
  try { return Buffer.from(md, "hex").toString("utf8"); } catch { return null; }
}

let _addedThisRun = 0;
function countNewAdds() { return _addedThisRun; }
function markAdded() { _addedThisRun++; }

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const lookback = Math.max(100, Math.min(20000, body?.lookbackLedgers ?? 5000));

  const client = getClient();
  await client.connect();
  try {
    const info = await client.request({ command: "server_info" });
    const seq = (info as any)?.result?.info?.validated_ledger?.seq
      ?? Number((((info as any)?.result?.info?.complete_ledgers as string) || "0-0").split("-")[1] || 0);
    const max = Number(seq) || 0;
    const min = Math.max(0, max - lookback);

    let marker: any = null;
    let scanned = 0, added = 0;
    do {
      const reqObj: any = {
        command: "account_tx",
        account: getIssuerAddress(),
        ledger_index_min: min,
        ledger_index_max: max,
        limit: 200,
        forward: false,
        binary: false,
      };
      if (marker) reqObj.marker = marker; // pass back exactly what you received

      const resp: any = await client.request(reqObj);
      marker = resp.result.marker ?? null;
      const rows = resp.result.transactions ?? [];
      for (const row of rows) {
        const { tx, meta, validated } = row;
        const before = (global as any).salesStore?.pendingSales?.size ?? 0;
        await tryIngestPaymentTx({ tx, meta, validated, source: "rescan" });
        const after = (global as any).salesStore?.pendingSales?.size ?? 0;
        if (after > before) added++;
        scanned++;
      }
    } while (marker);

    console.info(JSON.stringify({ event: "rescan_done", scanned, added, min, max }));
    return NextResponse.json({ scanned, added, min, max });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  } finally {
    await client.disconnect();
  }
}
