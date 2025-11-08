import core, { sendMPT, createMPTIssuanceWithClawback, assertAddress } from "@/lib/xrpl-logic"
import { toHttpError } from "@/app/api/_http";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { destination, units, mptIssuanceId: provided } = body as { destination: string, units: string, mptIssuanceId?: string }
    assertAddress(destination)
  core.assertWholeAmountString(units)
    const mptIssuanceId = provided || (await createMPTIssuanceWithClawback())
  const resp = await sendMPT(mptIssuanceId, destination, units)
  console.log(
    JSON.stringify(
      {
        route: "/api/mpt/send",
        txType: resp?.result?.TransactionType || "Payment",
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
