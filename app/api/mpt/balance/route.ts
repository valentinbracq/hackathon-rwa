import core, { readMPTBalance, assertAddress } from "@/lib/xrpl-logic"
// Auto-start listener when balance route is touched (server-only)
import "@/app/api/_worker/auto-start-listener";
export const runtime = 'nodejs'
import { toHttpError } from "@/app/api/_http";
import { startPaymentsListener } from "@/app/api/_worker/payments-listener";

export async function POST(request: Request) {
  try {
    await startPaymentsListener();
    const body = await request.json()
  const { account, mptIssuanceId } = body as { account: string, mptIssuanceId: string }
  // Explicit input validation before ledger query
  core.assertAddress(account)
  if (!mptIssuanceId) throw new Error("mptIssuanceId required")
    const balance = await readMPTBalance(mptIssuanceId, account)
    const tx: any = undefined
    console.log(
      JSON.stringify(
        {
          route: "/api/mpt/balance",
          txType: "READ",
          mptIssuanceId,
          hash: tx?.result?.hash,
          timestamp: new Date().toISOString()
        },
        null,
        2
      )
    )
    return Response.json({ success: true, balance })
  } catch (e: any) {
    const { status, body } = toHttpError(e);
    return new Response(body, { status });
  }
}
