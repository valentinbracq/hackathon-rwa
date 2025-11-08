import { NextResponse } from "next/server";
import core from "@/lib/xrpl-logic";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    network: process.env.XRPL_NETWORK || "devnet",
    issuer: core.getIssuerAddress(),
  });
}
