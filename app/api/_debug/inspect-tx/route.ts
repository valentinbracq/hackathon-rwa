import { NextResponse } from "next/server";
import core, { dropsToXrpString } from "@/lib/xrpl-logic";
import { getClient } from "@/lib/xrpl-logic";
const { convertHexToString } = require("xrpl");

export const runtime = "nodejs";

function keysOf(o:any){ try{ return o && typeof o==='object' ? Object.keys(o) : null }catch{ return null } }

// Helper: resolve native XRP amount (drops) from Amount | DeliverMax | meta.delivered_amount
function getXrpDrops(tx:any, meta:any){
  const v = tx?.Amount ?? tx?.DeliverMax ?? meta?.delivered_amount ?? null;
  if (!v) return null;
  // v can be string (native XRP in drops) or object (IOU). Keep only string.
  return typeof v === "string" ? v : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hash = url.searchParams.get("hash") || "";
  if (!/^[A-F0-9]{64}$/i.test(hash)) {
    return NextResponse.json({ ok: false, error: "bad_hash" }, { status: 400 });
  }

  const client = getClient();
  await client.connect();
  try {
    const raw = await client.request({ command: "tx", transaction: hash });

    // robuste pour {result:{…}} ou {…}
    const base = (raw && (raw as any).result && (raw as any).result.result) ? (raw as any).result.result
               : (raw && (raw as any).result) ? (raw as any).result
               : raw;

    const tx   = (base as any)?.tx_json ?? (base as any)?.tx ?? base;
    const meta = (base as any)?.meta ?? (base as any)?.metaData ?? null;
    const validated = Boolean(
      (base as any)?.validated ??
      (raw as any)?.result?.validated ??
      false
    );

    // lecture champs
    const issuer = core.getIssuerAddress();
    const memos  = Array.isArray((tx as any)?.Memos) ? (tx as any).Memos : [];
    const memoHex = memos[0]?.Memo?.MemoData ?? null;
    const memoUtf8 = memoHex ? convertHexToString(memoHex) : null;

    // parse memo via lib
    let parsed: any = null;
    try {
      const { parseCrownMemo } = require("@/lib/xrpl-logic");
      parsed = parseCrownMemo ? parseCrownMemo(memos) : null;
    } catch {}

    const destinationOk = (tx as any)?.Destination === issuer;
    const amountDrops = getXrpDrops(tx, meta) ?? "";
    const amountXrp = amountDrops ? dropsToXrpString(amountDrops) : null;

    // Determine source for amount
    const amountSource: "Amount" | "DeliverMax" | "meta.delivered_amount" | null =
      typeof (tx as any)?.Amount === "string" ? "Amount" :
      typeof (tx as any)?.DeliverMax === "string" ? "DeliverMax" :
      typeof (meta as any)?.delivered_amount === "string" ? "meta.delivered_amount" :
      null;

    // vérif unités
  let unitsOk = false, unitsCheckMsg = "ok";
    if (!parsed) {
      unitsCheckMsg = "memo_parse_failed";
    } else if (!amountDrops) {
      unitsCheckMsg = "amount_missing";
    } else {
      const drops = BigInt(amountDrops);
      const fullXrp = drops % BigInt(1_000_000) === BigInt(0);
      const intUnits = BigInt(parsed.units);
      unitsOk = fullXrp && drops / BigInt(1_000_000) === intUnits;
      if (!unitsOk) unitsCheckMsg = "units_mismatch_or_non_integer_xrp";
    }

    return NextResponse.json({
      ok: true,
      hash,
      network: process.env.XRPL_NETWORK,
      issuer,
      txType: (tx as any)?.TransactionType,
      destination: (tx as any)?.Destination,
      destinationOk,
      amountDrops,
      amountXrp,
      amountSource,
      memoHex,
      memoUtf8,
      parsed,
      validated,
      resultCode: meta?.TransactionResult ?? null,
      unitsOk,
      unitsCheckMsg,
      debug: {
        topKeys: keysOf(raw),
        resultKeys: keysOf((raw as any)?.result),
        nestedResultKeys: keysOf((raw as any)?.result?.result),
        baseKeys: keysOf(base),
        txKeys: keysOf(tx),
        metaKeys: keysOf(meta),
        shapes: {
          has_result: Boolean((raw as any)?.result),
          has_result_result: Boolean((raw as any)?.result?.result),
          base_is_tx_like: Boolean((tx as any)?.TransactionType || (tx as any)?.Amount || (tx as any)?.Destination),
        }
      }
    });
  } finally {
    await client.disconnect();
  }
}
