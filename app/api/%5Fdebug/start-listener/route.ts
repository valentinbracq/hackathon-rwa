import { NextResponse } from "next/server";
import { startPaymentsListener } from "@/app/api/_worker/payments-listener";

export const runtime = "nodejs";

export async function GET() {
  try {
    await startPaymentsListener();
    return NextResponse.json({ ok: true, started: true });
  } catch (e: any) {
    console.error("[_debug/start-listener] error", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
