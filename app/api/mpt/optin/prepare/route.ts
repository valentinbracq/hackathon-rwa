import core from "@/lib/xrpl-logic";

export async function POST(req: Request) {
  try {
    const { mptIssuanceId, holder } = await req.json();
    if (!mptIssuanceId) return new Response("mptIssuanceId required", { status: 400 });
    core.assertAddress(holder);
    const tx = await core.prepareHolderOptInTx(mptIssuanceId, holder);
    console.log(
      JSON.stringify(
        {
          route: "/api/mpt/optin/prepare",
          txType: "MPTokenAuthorize",
          mptIssuanceId,
          holder,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
    return new Response(JSON.stringify({ txJSON: tx }), { status: 200 });
  } catch (e: any) {
    const msg = e?.message || "Prepare failed";
    const isInput = /Invalid XRPL address|required/i.test(msg);
    return new Response(msg, { status: isInput ? 400 : 500 });
  }
}
