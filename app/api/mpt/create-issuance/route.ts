import core, { createMPTIssuanceWithClawback } from "@/lib/xrpl-logic"
import { toHttpError } from "@/app/api/_http";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { assetScale, maximumAmount } = body
    const mptIssuanceId = await createMPTIssuanceWithClawback({ assetScale, maximumAmount })
    const tx: any = undefined
    console.log(
      JSON.stringify(
        {
          route: "/api/mpt/create-issuance",
          txType: "MPTokenIssuanceCreate",
          mptIssuanceId,
          hash: tx?.result?.hash,
          timestamp: new Date().toISOString()
        },
        null,
        2
      )
    )
    return Response.json({ success: true, mptIssuanceId })
  } catch (e: any) {
    const { status, body } = toHttpError(e);
    return new Response(body, { status });
  }
}
