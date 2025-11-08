import core from "@/lib/xrpl-logic";
// Auto-start listener when this route is loaded server-side
import "@/app/api/_worker/auto-start-listener";
export const runtime = 'nodejs'
import { toHttpError } from "@/app/api/_http";
import { startPaymentsListener } from "@/app/api/_worker/payments-listener";

export async function POST(req: Request) {
  try {
    await startPaymentsListener();
    const { mptIssuanceId, holder } = await req.json();
    core.assertAddress(holder);
    if (!mptIssuanceId) return new Response("mptIssuanceId required", { status: 400 });
    const res = await core.authorizeHolderForIssuance(mptIssuanceId, holder);
    console.log(
      JSON.stringify(
        {
          route: "/api/mpt/authorize-holder",
          txType: "MPTokenAuthorize",
          mptIssuanceId,
          holder,
          result: res,
          timestamp: new Date().toISOString()
        },
        null,
        2
      )
    );
    return new Response(JSON.stringify(res), { status: 200 });
  } catch (e: any) {
    const { status, body } = toHttpError(e);
    return new Response(body, { status });
  }
}
