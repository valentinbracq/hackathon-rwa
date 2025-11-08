import core, { clawbackMPT, createMPTIssuanceWithClawback, assertAddress } from "@/lib/xrpl-logic"
import { toHttpError } from "@/app/api/_http";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { holder, units, mptIssuanceId: provided, investorAddress, amount } = body as any
    // Support both new and legacy field names from old UI
    const holderAddr = holder || investorAddress
    const value = units || amount
    assertAddress(holderAddr)
  core.assertWholeAmountString(value)
    const mptIssuanceId = provided || (await createMPTIssuanceWithClawback())
  const resp = await clawbackMPT(mptIssuanceId, holderAddr, value)
  console.log(
    JSON.stringify(
      {
        route: "/api/mpt/clawback",
        txType: resp?.result?.TransactionType || "Clawback",
        mptIssuanceId,
        hash: resp?.result?.hash,
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  )
  return Response.json({ success: true, mptIssuanceId, hash: resp.result?.hash })
  } catch (e: any) {
    const { status, body } = toHttpError(e);
    return new Response(body, { status });
  }
}
