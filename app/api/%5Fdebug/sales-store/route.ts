import { NextResponse } from "next/server";
import { salesStore } from "@/lib/pending-sales";

export const runtime = 'nodejs';

export async function GET() {
  const size = salesStore.pendingSales.size;
  const first = size ? Array.from(salesStore.pendingSales.values())[0] : null;
  return NextResponse.json({
    pid: process.pid,
    size,
    sample: first ? {
      paymentTx: first.paymentTx ?? (first as any).hash_payment,
      holder: first.holder,
      status: first.status,
      createdAt: first.createdAt,
    } : null,
  });
}
