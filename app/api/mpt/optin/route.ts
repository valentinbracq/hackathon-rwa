import core from "@/lib/xrpl-logic";
import { toHttpError } from "@/app/api/_http";

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return new Response("Disabled in production", { status: 403 });
    }
    const { mptIssuanceId, holder } = await req.json();
    if (!mptIssuanceId || !holder) {
      return new Response("mptIssuanceId and holder required", { status: 400 });
    }
    core.assertAddress(holder);
    const prepared = await core.prepareHolderOptInTx(mptIssuanceId, holder);
    console.log(
      JSON.stringify(
        {
          route: "/api/mpt/optin",
          txType: prepared?.TransactionType || "MPTokenAuthorize",
          mptIssuanceId,
          account: prepared?.Account,
          prepared: true,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
    // Return the unsigned, autofilled transaction for the client wallet to sign & submit
    return new Response(JSON.stringify({ tx: prepared }), { status: 200 });
  } catch (e: any) {
    const { status, body } = toHttpError(e);
    return new Response(body, { status });
  }
}
